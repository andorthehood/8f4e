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
			featureFlags: { projectCreation: false, projectOpening: false },
			initialProjectUrl: canvas.dataset.projectUrl || undefined,
			storage: window.localStorage,
			storageNamespace: index === 0 ? '8f4e-website' : `8f4e-website-${index + 1}`,
		}),
	}))
);
const editors = editorEntries.map(({ editor }) => editor);

const editorByCanvas = new Map(editorEntries.map(({ canvas, editor }) => [canvas, editor]));
const renderingReleaseDelayMs = 3_000;
const renderingReleaseTimeoutByCanvas = new Map<HTMLCanvasElement, number>();
const renderingObserver = new IntersectionObserver(entries => {
	for (const entry of entries) {
		const canvas = entry.target as HTMLCanvasElement;
		const editor = editorByCanvas.get(canvas);
		const pendingRelease = renderingReleaseTimeoutByCanvas.get(canvas);
		if (pendingRelease !== undefined) {
			window.clearTimeout(pendingRelease);
			renderingReleaseTimeoutByCanvas.delete(canvas);
		}
		if (entry.isIntersecting) {
			editor?.resumeRendering();
		} else {
			const timeout = window.setTimeout(() => {
				renderingReleaseTimeoutByCanvas.delete(canvas);
				editor?.releaseRenderingResources();
			}, renderingReleaseDelayMs);
			renderingReleaseTimeoutByCanvas.set(canvas, timeout);
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
	for (const timeout of renderingReleaseTimeoutByCanvas.values()) {
		window.clearTimeout(timeout);
	}
	renderingReleaseTimeoutByCanvas.clear();
	for (const editor of editors) {
		editor.dispose();
	}
});
