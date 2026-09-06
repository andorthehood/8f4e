import { afterEach, describe, expect, it, vi } from 'vitest';
import { exportBinaryCode, exportCanvasScreenshot, exportProject, prepareProjectExport } from './storage-callbacks';

vi.mock('@8f4e/compiler', () => ({ parseProjectSource: vi.fn() }));

function picker() {
	const write = vi.fn(async (_blob: Blob) => {});
	const close = vi.fn(async () => {});
	const createWritable = vi.fn(async () => ({ write, close }));
	const showSaveFilePicker = vi.fn(async () => ({ createWritable }));
	vi.stubGlobal('window', { showSaveFilePicker });
	return { write, close, createWritable, showSaveFilePicker };
}

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe('export callbacks', () => {
	it('opens the picker synchronously, then waits for text before opening a writable', async () => {
		const p = picker();
		const preparing = prepareProjectExport('captured.8f4e');
		expect(p.showSaveFilePicker).toHaveBeenCalledWith({
			suggestedName: 'captured.8f4e',
			types: [{ description: '8f4e Project', accept: { 'text/plain': ['.8f4e'] } }],
		});
		const save = await preparing;
		expect(p.createWritable).not.toHaveBeenCalled();
		await save!('8f4e/v1\n\n');
		expect(await p.write.mock.calls[0][0].text()).toBe('8f4e/v1\n\n');
		expect(p.close).toHaveBeenCalledOnce();
	});

	it('treats cancellation as a normal result without writing', async () => {
		const p = picker();
		p.showSaveFilePicker.mockRejectedValue(new DOMException('Cancelled', 'AbortError'));
		expect(await prepareProjectExport('project.8f4e')).toBeUndefined();
		expect(p.createWritable).not.toHaveBeenCalled();
	});

	it('propagates picker and write failures to the export effect', async () => {
		const p = picker();
		p.showSaveFilePicker.mockRejectedValueOnce(new Error('Picker unavailable'));
		await expect(prepareProjectExport('project.8f4e')).rejects.toThrow('Picker unavailable');
		const save = await prepareProjectExport('project.8f4e');
		p.write.mockRejectedValueOnce(new Error('Disk full'));
		await expect(save!('text')).rejects.toThrow('Disk full');
	});

	it('defers fallback download until text is available and releases its object URL', async () => {
		vi.stubGlobal('window', {});
		const a = { style: { display: '' }, href: '', download: '', click: vi.fn() };
		const appendChild = vi.fn();
		const removeChild = vi.fn();
		vi.stubGlobal('document', { createElement: vi.fn(() => a), body: { appendChild, removeChild } });
		const createURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:export');
		const revokeURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
		const save = await prepareProjectExport('captured.8f4e');
		expect(createURL).not.toHaveBeenCalled();
		await save!('captured text');
		expect(a.download).toBe('captured.8f4e');
		expect(a.click).toHaveBeenCalledOnce();
		expect(await (createURL.mock.calls[0][0] as Blob).text()).toBe('captured text');
		expect(removeChild).toHaveBeenCalledWith(a);
		expect(revokeURL).toHaveBeenCalledWith('blob:export');
	});

	it('retains the string export API and binary and screenshot contents', async () => {
		const p = picker();
		await exportProject('project text', 'project.8f4e');
		await exportBinaryCode('project.wasm', new Uint8Array([0, 97, 115, 109]));
		const screenshot = new Blob(['png'], { type: 'image/png' });
		await exportCanvasScreenshot(screenshot, 'project.png');
		expect(await p.write.mock.calls[0][0].text()).toBe('project text');
		expect(new Uint8Array(await p.write.mock.calls[1][0].arrayBuffer())).toEqual(new Uint8Array([0, 97, 115, 109]));
		expect(p.write.mock.calls[2][0]).toBe(screenshot);
		expect(
			p.showSaveFilePicker.mock.calls.map(call => (call as unknown as [{ suggestedName: string }])[0].suggestedName)
		).toEqual(['project.8f4e', 'project.wasm', 'project.png']);
	});
});
