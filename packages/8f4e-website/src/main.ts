import { type DefaultEditorInstance, mountDefaultEditor } from '@8f4e/editor-default';

interface EditorMount {
	canvasId: string;
	storageNamespace: string;
}

const editorMounts: EditorMount[] = [
	{ canvasId: 'editor-one', storageNamespace: '8f4e-website-editor-one' },
	{ canvasId: 'editor-two', storageNamespace: '8f4e-website-editor-two' },
];

const editors: DefaultEditorInstance[] = [];

async function mountEditor({ canvasId, storageNamespace }: EditorMount): Promise<DefaultEditorInstance> {
	const canvas = document.querySelector<HTMLCanvasElement>(`#${canvasId}`);
	if (!canvas) {
		throw new Error(`Editor canvas not found: ${canvasId}`);
	}

	const editor = await mountDefaultEditor(canvas, {
		captureWheel: false,
		storage: window.localStorage,
		storageNamespace,
	});

	document.querySelector(`[data-loading-for="${canvasId}"]`)?.remove();
	return editor;
}

try {
	for (const editorMount of editorMounts) {
		editors.push(await mountEditor(editorMount));
	}

	Object.assign(window, {
		editors,
		editorStates: editors.map(editor => editor.state),
	});
} catch (error) {
	for (const editor of editors) {
		editor.dispose();
	}
	throw error;
}

import.meta.hot?.dispose(() => {
	for (const editor of editors) {
		editor.dispose();
	}
});
