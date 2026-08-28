import { mountDefaultEditor } from '@8f4e/editor-default';

const canvases = document.querySelectorAll<HTMLCanvasElement>('.editor-row canvas');
if (canvases.length === 0) {
	throw new Error('Editor canvases not found');
}

const editors = await Promise.all(
	Array.from(canvases, (canvas, index) =>
		mountDefaultEditor(canvas, {
			captureWheel: false,
			initialProjectUrl: canvas.dataset.projectUrl || undefined,
			storage: window.localStorage,
			storageNamespace: index === 0 ? '8f4e-website' : `8f4e-website-${index + 1}`,
		})
	)
);

const [editor] = editors;

Object.assign(window, { editor, editors, state: editor.state });

import.meta.hot?.dispose(() => {
	for (const editor of editors) {
		editor.dispose();
	}
});
