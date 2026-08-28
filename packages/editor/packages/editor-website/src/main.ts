import { mountDefaultEditor } from '@8f4e/editor-default';

const canvas = document.querySelector<HTMLCanvasElement>('#glcanvas');

if (!canvas) {
	throw new Error('Editor canvas not found');
}

const url = new URL(window.location.href);
const initialProjectUrl = url.searchParams.get('projectUrl') || undefined;
if (initialProjectUrl) {
	url.searchParams.delete('projectUrl');
	window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
}

canvas.focus({ preventScroll: true });
const editor = await mountDefaultEditor(canvas, {
	initialProjectUrl,
	storage: window.localStorage,
	storageNamespace: 'editor',
});
Object.assign(window, { state: editor.state });

import.meta.hot?.dispose(() => editor.dispose());
