import { mountDefaultEditor } from '@8f4e/editor-default';

const canvas = document.querySelector<HTMLCanvasElement>('#editor');
if (!canvas) {
	throw new Error('Editor canvas not found');
}

const editor = await mountDefaultEditor(canvas, {
	captureWheel: false,
	storage: window.localStorage,
	storageNamespace: '8f4e-website',
});

Object.assign(window, { editor, state: editor.state });

import.meta.hot?.dispose(() => editor.dispose());
