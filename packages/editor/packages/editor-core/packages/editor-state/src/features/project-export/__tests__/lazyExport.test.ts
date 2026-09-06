import createStateManager from '@8f4e/state-manager';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMockCodeBlock, createMockState } from '~/pureHelpers/testingUtils/testUtils';
import { createMockEventDispatcherWithVitest } from '~/pureHelpers/testingUtils/vitestTestUtils';
import projectExport from '../effect';
import * as formatter from '../serializeTo8f4e';
import serializeToProject from '../serializeToProject';

function setup(loadFormatter = vi.fn(async () => formatter)) {
	const state = createMockState();
	const exportProject = vi.fn(async (_text: string, _fileName: string) => {});
	state.callbacks.exportProject = exportProject;
	const store = createStateManager(state);
	const events = createMockEventDispatcherWithVitest();
	const dispose = projectExport(store, events, loadFormatter);
	const handler = (name: string) => vi.mocked(events.on).mock.calls.find(([event]) => event === name)![1];
	const run = () => handler('exportProject')({});
	return { state, store, events, dispose, handler, run, loadFormatter, exportProject };
}

afterEach(() => vi.restoreAllMocks());

describe('lazy project export', () => {
	it('keeps startup, autosave, and binary export independent of the formatter', async () => {
		const app = setup();
		const saveSession = vi.fn(async () => {});
		app.state.callbacks.saveSession = saveSession;
		app.state.callbacks.exportBinaryCode = vi.fn(async () => {});
		await app.handler('saveSession')({});
		app.store.set('codeBlockRendering.codeBlocks', []);
		await app.handler('exportWasm')({});
		expect(saveSession).toHaveBeenCalledTimes(2);
		expect(app.state.callbacks.exportBinaryCode).toHaveBeenCalledWith('project.wasm');
		expect(app.loadFormatter).not.toHaveBeenCalled();
	});

	it('captures nested code, filename, and legacy callback before waiting for the formatter', async () => {
		const pending = Promise.withResolvers<typeof formatter>();
		const app = setup(vi.fn(() => pending.promise));
		const child = createMockCodeBlock({ blockType: 'module', code: ['module child', 'moduleEnd'], entry: 'main' });
		const group = createMockCodeBlock({
			name: 'audio',
			code: ['group audio', 'groupEnd'],
			entry: 'main',
			nestedProjectCodeBlocks: [child],
		});
		app.state.codeBlockRendering.rootCodeBlocks.push(group);
		app.state.editorConfig.export = { fileName: 'original' };
		const expected = formatter.serializeProjectTo8f4e(serializeToProject(app.state));
		const exporting = app.run();
		child.code.splice(0, 1, 'module changed');
		group.code.splice(0, 1, 'group changed');
		app.state.codeBlockRendering.rootCodeBlocks.length = 0;
		app.state.editorConfig.export.fileName = 'changed';
		app.state.callbacks.exportProject = vi.fn();
		pending.resolve(formatter);
		await exporting;
		expect(app.exportProject).toHaveBeenCalledWith(expected, 'original.8f4e');
		expect(app.state.callbacks.exportProject).not.toHaveBeenCalled();
	});

	it('prepares the destination synchronously before importing and supports preparation without a legacy callback', async () => {
		const destination = Promise.withResolvers<((text: string) => Promise<void>) | undefined>();
		const app = setup();
		const save = vi.fn(async () => {});
		app.state.callbacks.exportProject = undefined;
		app.state.callbacks.prepareProjectExport = vi.fn(() => destination.promise);
		const exporting = app.run();
		expect(app.state.callbacks.prepareProjectExport).toHaveBeenCalledWith('project.8f4e');
		expect(app.loadFormatter).not.toHaveBeenCalled();
		destination.resolve(save);
		await exporting;
		expect(save).toHaveBeenCalledWith('8f4e/v1\n\n');
	});

	it('captures the snapshot before destination preparation completes', async () => {
		const destination = Promise.withResolvers<((text: string) => Promise<void>) | undefined>();
		const app = setup();
		const save = vi.fn(async () => {});
		app.state.callbacks.prepareProjectExport = () => destination.promise;
		const exporting = app.run();
		app.state.codeBlockRendering.rootCodeBlocks.push(
			createMockCodeBlock({ blockType: 'note', code: ['note late', 'noteEnd'] })
		);
		destination.resolve(save);
		await exporting;
		expect(save).toHaveBeenCalledWith('8f4e/v1\n\n');
		expect(app.exportProject).not.toHaveBeenCalled();
	});

	it('does not import or write after picker cancellation', async () => {
		const app = setup();
		app.state.callbacks.prepareProjectExport = async () => undefined;
		await app.run();
		expect(app.loadFormatter).not.toHaveBeenCalled();
		expect(app.exportProject).not.toHaveBeenCalled();
	});

	it('handles a failed import and allows another export attempt', async () => {
		const log = vi.spyOn(console, 'error').mockImplementation(() => {});
		const app = setup(vi.fn().mockRejectedValueOnce(new Error('Network failure')).mockResolvedValue(formatter));
		await app.run();
		expect(app.exportProject).not.toHaveBeenCalled();
		expect(log).toHaveBeenCalledOnce();
		await app.run();
		expect(app.exportProject).toHaveBeenCalledOnce();
	});

	it('does not write invalid project text and handles synchronous callback errors', async () => {
		const log = vi.spyOn(console, 'error').mockImplementation(() => {});
		const app = setup();
		app.state.codeBlockRendering.rootCodeBlocks.push(
			createMockCodeBlock({ blockType: 'module', code: ['module broken'], entry: 'main' })
		);
		await app.run();
		expect(app.exportProject).not.toHaveBeenCalled();
		app.state.codeBlockRendering.rootCodeBlocks.length = 0;
		app.state.callbacks.exportProject = () => {
			throw new Error('Synchronous failure');
		};
		await app.run();
		expect(log).toHaveBeenCalledTimes(2);
	});

	it.each(['prepare', 'format'])('cancels an export disposed during %s', async phase => {
		const pending = Promise.withResolvers<typeof formatter>();
		const destination = Promise.withResolvers<((text: string) => Promise<void>) | undefined>();
		const app = setup(vi.fn(() => pending.promise));
		const save = vi.fn(async () => {});
		if (phase === 'prepare') app.state.callbacks.prepareProjectExport = () => destination.promise;
		const exporting = app.run();
		app.dispose();
		destination.resolve(save);
		pending.resolve(formatter);
		await exporting;
		expect(save).not.toHaveBeenCalled();
		expect(app.exportProject).not.toHaveBeenCalled();
		for (const [event, handler] of vi.mocked(app.events.on).mock.calls) {
			expect(app.events.off).toHaveBeenCalledWith(event, handler);
		}
	});

	it('exports identical text and names on repeated exports of the same project', async () => {
		const app = setup();
		await app.run();
		await app.run();
		expect(app.exportProject.mock.calls[0]).toEqual(app.exportProject.mock.calls[1]);
	});
});
