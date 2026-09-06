import type { ContextMenuItem } from '@8f4e/editor-state-types';
import createStateManager from '@8f4e/state-manager';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMockCodeBlock, createMockState } from '~/pureHelpers/testingUtils/testUtils';
import { createMockEventDispatcherWithVitest } from '~/pureHelpers/testingUtils/vitestTestUtils';
import contextMenu from './effect';
import * as menus from './menus';

function deferred<T>() {
	return Promise.withResolvers<T>();
}

function setup(loadBuilders = vi.fn(async () => menus), state = createMockState()) {
	const store = createStateManager(state);
	const events = createMockEventDispatcherWithVitest();
	const dispose = contextMenu(store, events, loadBuilders);
	const handler = (name: string) => vi.mocked(events.on).mock.calls.find(([event]) => event === name)![1];
	const open = () => handler('contextmenu')({ x: 400, y: 100 });
	const sub = (menu: string, payload = {}) => handler('openSubMenu')({ menu, ...payload });
	const back = () => handler('menuBack')({});
	return { state, store, events, dispose, handler, open, sub, back, loadBuilders };
}

afterEach(() => vi.restoreAllMocks());

describe('lazy context menus', () => {
	it('waits until first use and captures dismissal before loading finishes', async () => {
		const pending = deferred<typeof menus>();
		const app = setup(vi.fn(() => pending.promise));
		expect(app.loadBuilders).not.toHaveBeenCalled();
		const opening = app.open();
		expect(app.state.contextMenu.open).toBe(false);
		const event = { x: 0, y: 0, stopPropagation: false };
		app.handler('mousedown')(event);
		expect(event.stopPropagation).toBe(true);
		pending.resolve(menus);
		await opening;
		expect(app.state.contextMenu.open).toBe(false);
		expect(app.state.contextMenu.items).toEqual([]);
		await app.open();
		expect(app.state.contextMenu.open).toBe(true);
	});

	it('only applies the latest open while builders are loading', async () => {
		const pending = deferred<typeof menus>();
		const mainMenu = vi.fn(menus.mainMenu);
		const app = setup(vi.fn(() => pending.promise));
		const first = app.open();
		const second = app.handler('contextmenu')({ x: 32, y: 48 });
		pending.resolve({ ...menus, mainMenu });
		await Promise.all([first, second]);
		expect(mainMenu).toHaveBeenCalledTimes(1);
		expect(app.state.contextMenu.x).toBe(32);
		expect(app.state.contextMenu.y).toBe(48);
	});

	it.each([
		'selection',
		'selection restored',
		'direct selection',
		'project',
		'disabled',
		'view mode',
		'close',
		'dispose',
	])('cancels pending loads after %s changes', async change => {
		const pending = deferred<typeof menus>();
		const app = setup(vi.fn(() => pending.promise));
		const opening = app.open();
		if (change === 'selection' || change === 'selection restored') {
			app.store.set('codeBlockRendering.selectedCodeBlock', createMockCodeBlock());
			if (change === 'selection restored') app.store.set('codeBlockRendering.selectedCodeBlock', undefined);
		} else if (change === 'direct selection') {
			app.state.codeBlockRendering.selectedCodeBlock = createMockCodeBlock();
		} else if (change === 'project') {
			app.store.set('codeBlockRendering.codeBlocks', []);
		} else if (change === 'disabled') {
			app.store.set('featureFlags.contextMenu', false);
		} else if (change === 'view mode') {
			app.store.set('featureFlags.editing', false);
		} else if (change === 'close') {
			app.store.set('contextMenu.open', false);
		} else {
			app.dispose();
		}
		pending.resolve(menus);
		await opening;
		expect(app.state.contextMenu.open).toBe(false);
		expect(app.state.contextMenu.items).toEqual([]);
	});

	it('handles load failure and permits a later attempt', async () => {
		const error = new Error('Network unavailable');
		const log = vi.spyOn(console, 'error').mockImplementation(() => {});
		const app = setup(vi.fn().mockRejectedValueOnce(error).mockResolvedValue(menus));
		await app.open();
		expect(app.state.contextMenu.open).toBe(false);
		expect(log).toHaveBeenCalledWith('Failed to open context menu:', error);
		await app.open();
		expect(app.state.contextMenu.open).toBe(true);
	});

	it('ignores failures from replaced requests', async () => {
		const pending = deferred<typeof menus>();
		const log = vi.spyOn(console, 'error').mockImplementation(() => {});
		const app = setup(vi.fn().mockReturnValueOnce(pending.promise).mockResolvedValue(menus));
		const first = app.open();
		await app.open();
		const items = app.state.contextMenu.items;
		pending.reject(new Error('Old failure'));
		await first;
		expect(app.state.contextMenu.open).toBe(true);
		expect(app.state.contextMenu.items).toBe(items);
		expect(log).not.toHaveBeenCalled();
	});

	it('retains category paths through multiple levels and Back, then resets on a root open', async () => {
		const app = setup();
		app.state.callbacks.getListOfModules = async () => [
			{ title: 'Oscillator', slug: 'osc', category: 'Audio/Sources' },
		];
		await app.open();
		await app.sub('moduleCategoriesMenu');
		await app.sub('moduleCategoriesMenu', { path: ['Audio'] });
		await app.sub('moduleCategoriesMenu', { path: ['Audio', 'Sources'] });
		expect(app.state.contextMenu.items.some(item => item.payload?.codeBlockSlug === 'osc')).toBe(true);
		await app.back();
		expect(app.state.contextMenu.menuStack).toHaveLength(2);
		expect(app.state.contextMenu.items.some(item => item.title?.includes('Sources'))).toBe(true);
		await app.back();
		expect(app.state.contextMenu.menuStack).toHaveLength(1);
		expect(app.state.contextMenu.items.some(item => item.title?.includes('Audio'))).toBe(true);
		await app.back();
		expect(app.state.contextMenu.menuStack).toEqual([]);
		expect(app.state.contextMenu.items.some(item => item.title?.includes('< Back'))).toBe(false);
		await app.sub('favoritesMenu');
		await app.open();
		expect(app.state.contextMenu.menuStack).toEqual([]);
	});

	it.each(['submenu', 'back', 'root', 'dismiss', 'selection', 'dispose'])(
		'does not apply an async builder after %s',
		async action => {
			const pending = deferred<ContextMenuItem[]>();
			const moduleCategoriesMenu = vi.fn(() => pending.promise);
			const app = setup(vi.fn(async () => ({ ...menus, moduleCategoriesMenu })));
			await app.open();
			const loading = app.sub('moduleCategoriesMenu');
			await vi.waitFor(() => expect(moduleCategoriesMenu).toHaveBeenCalled());
			if (action === 'submenu') await app.sub('favoritesMenu');
			else if (action === 'back') await app.back();
			else if (action === 'root') await app.open();
			else if (action === 'dismiss') {
				app.state.contextMenu.highlightedItem = Infinity;
				app.handler('mousedown')({ x: 0, y: 0 });
			} else if (action === 'selection') {
				app.store.set('codeBlockRendering.selectedCodeBlock', createMockCodeBlock());
			} else app.dispose();
			const expected = { ...app.state.contextMenu };
			pending.resolve([{ title: 'Stale result' }]);
			await loading;
			expect(app.state.contextMenu).toEqual(expected);
		}
	);

	it('handles builder failures without committing navigation', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		const app = setup();
		app.state.callbacks.getListOfModules = vi
			.fn()
			.mockRejectedValueOnce(new Error('Catalog unavailable'))
			.mockResolvedValue([]);
		await app.open();
		await app.sub('moduleCategoriesMenu');
		expect(app.state.contextMenu.open).toBe(false);
		expect(app.state.contextMenu.menuStack).toEqual([]);
		await app.open();
		await app.sub('moduleCategoriesMenu');
		expect(app.state.contextMenu.open).toBe(true);
	});

	it('keeps view-mode favorites available and respects disabled context menus', async () => {
		const app = setup();
		app.state.featureFlags.contextMenu = false;
		await app.open();
		await app.sub('favoritesMenu');
		await app.back();
		expect(app.loadBuilders).not.toHaveBeenCalled();
		app.state.featureFlags.contextMenu = true;
		app.state.featureFlags.editing = false;
		await app.open();
		expect(app.state.contextMenu.items.some(item => item.action === 'addCodeBlock')).toBe(false);
		await app.sub('favoritesMenu');
		expect(app.state.contextMenu.items.some(item => item.title?.includes('No favorites'))).toBe(true);
	});

	it('builds module actions for the selected block', async () => {
		const app = setup();
		const block = createMockCodeBlock({ x: 350, y: 50, blockType: 'module' });
		app.state.codeBlockRendering.codeBlocks.push(block);
		app.state.codeBlockRendering.selectedCodeBlock = block;
		await app.open();
		expect(app.state.contextMenu.items.find(item => item.action === 'deleteCodeBlock')?.payload?.codeBlock).toBe(block);
	});

	it('removes every listener and subscription on disposal', async () => {
		const app = setup();
		const unsubscribe = vi.spyOn(app.store, 'unsubscribe');
		await app.open();
		app.dispose();
		for (const [name, handler] of vi.mocked(app.events.on).mock.calls) {
			expect(app.events.off).toHaveBeenCalledWith(name, handler);
		}
		expect(unsubscribe).toHaveBeenCalledTimes(4);
		const calls = app.loadBuilders.mock.calls.length;
		await app.open();
		await app.sub('favoritesMenu');
		await app.back();
		expect(app.loadBuilders).toHaveBeenCalledTimes(calls);
	});
});
