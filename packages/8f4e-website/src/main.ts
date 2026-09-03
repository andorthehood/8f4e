import { type DefaultEditorInstance, mountDefaultEditor } from '@8f4e/editor-default';

const canvases = Array.from(document.querySelectorAll<HTMLCanvasElement>('.editor-row canvas'));
if (canvases.length === 0) {
	throw new Error('Editor canvases not found');
}

if (import.meta.env.DEV) {
	const cacheBuster = Date.now().toString();
	for (const canvas of canvases) {
		if (canvas.dataset.projectUrl) {
			const projectUrl = new URL(canvas.dataset.projectUrl);
			projectUrl.searchParams.set('v', cacheBuster);
			canvas.dataset.projectUrl = projectUrl.toString();
		}
	}
}

const renderingReleaseDelayMs = 2_000;
const editorByCanvas = new Map<HTMLCanvasElement, DefaultEditorInstance>();
const editorMountPromiseByCanvas = new Map<HTMLCanvasElement, Promise<DefaultEditorInstance>>();
const renderingReleaseTimeoutByCanvas = new Map<HTMLCanvasElement, number>();
const editors: DefaultEditorInstance[] = [];
let disposed = false;

function syncEditors(): void {
	editors.splice(
		0,
		editors.length,
		...canvases.flatMap(canvas => {
			const editor = editorByCanvas.get(canvas);
			return editor ? [editor] : [];
		})
	);
}

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
			editor?.pauseRendering();
			const timeout = window.setTimeout(() => {
				renderingReleaseTimeoutByCanvas.delete(canvas);
				editor?.releaseRenderingResources();
			}, renderingReleaseDelayMs);
			renderingReleaseTimeoutByCanvas.set(canvas, timeout);
		}
	}
});

function mountEditor(canvas: HTMLCanvasElement, index: number): Promise<DefaultEditorInstance> {
	const pendingMount = editorMountPromiseByCanvas.get(canvas);
	if (pendingMount) {
		return pendingMount;
	}

	const mountPromise = mountDefaultEditor(canvas, {
		captureWheel: false,
		featureFlags: { browserLocalNotes: false, projectCreation: false, projectOpening: false },
		initialProjectUrl: canvas.dataset.projectUrl || undefined,
		storage: window.localStorage,
		storageNamespace: index === 0 ? '8f4e-website' : `8f4e-website-${index + 1}`,
	})
		.then(editor => {
			if (disposed) {
				editor.dispose();
				return editor;
			}

			editorByCanvas.set(canvas, editor);
			canvas.classList.add('editor-mounted');
			syncEditors();
			renderingObserver.observe(canvas);
			if (index === 0) {
				Object.assign(window, { editor, state: editor.state });
			}
			return editor;
		})
		.catch(error => {
			editorMountPromiseByCanvas.delete(canvas);
			throw error;
		});

	editorMountPromiseByCanvas.set(canvas, mountPromise);
	return mountPromise;
}

const canvasIndex = new Map(canvases.map((canvas, index) => [canvas, index]));
const mountingObserver = new IntersectionObserver(entries => {
	for (const entry of entries) {
		if (!entry.isIntersecting) {
			continue;
		}

		const canvas = entry.target as HTMLCanvasElement;
		const index = canvasIndex.get(canvas);
		if (index === undefined) {
			continue;
		}

		void mountEditor(canvas, index)
			.then(() => mountingObserver.unobserve(canvas))
			.catch(error => console.error('Failed to mount editor:', error));
	}
});
for (const canvas of canvases) {
	mountingObserver.observe(canvas);
}

Object.assign(window, { editors });

import.meta.hot?.dispose(() => {
	disposed = true;
	mountingObserver.disconnect();
	renderingObserver.disconnect();
	for (const timeout of renderingReleaseTimeoutByCanvas.values()) {
		window.clearTimeout(timeout);
	}
	renderingReleaseTimeoutByCanvas.clear();
	for (const editor of editors) {
		editor.dispose();
	}
	editors.length = 0;
	editorByCanvas.clear();
});
