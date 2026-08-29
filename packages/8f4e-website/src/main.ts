import { mountDefaultEditor } from '@8f4e/editor-default';

const canvases = document.querySelectorAll<HTMLCanvasElement>('.editor-row canvas');
if (canvases.length === 0) {
	throw new Error('Editor canvases not found');
}

const editorEntries = await Promise.all(
	Array.from(canvases, async (canvas, index) => ({
		canvas,
		editor: await mountDefaultEditor(canvas, {
			captureWheel: false,
			initialProjectUrl: canvas.dataset.projectUrl || undefined,
			storage: window.localStorage,
			storageNamespace: index === 0 ? '8f4e-website' : `8f4e-website-${index + 1}`,
		}),
	}))
);
const editors = editorEntries.map(({ editor }) => editor);

const editorByCanvas = new Map(editorEntries.map(({ canvas, editor }) => [canvas, editor]));
const renderingObserver = new IntersectionObserver(entries => {
	for (const entry of entries) {
		const editor = editorByCanvas.get(entry.target as HTMLCanvasElement);
		if (entry.isIntersecting) {
			editor?.resumeRendering();
		} else {
			editor?.pauseRendering();
		}
	}
});
for (const canvas of canvases) {
	renderingObserver.observe(canvas);
}

const [editor] = editors;

Object.assign(window, { editor, editors, state: editor.state });

import.meta.hot?.dispose(() => {
	renderingObserver.disconnect();
	for (const editor of editors) {
		editor.dispose();
	}
});
