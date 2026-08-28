import { mountDefaultEditor } from '@8f4e/editor-default';

const canvas = document.querySelector<HTMLCanvasElement>('#glcanvas');

if (!canvas) {
	throw new Error('Editor canvas not found');
}

canvas.focus({ preventScroll: true });
void mountDefaultEditor(canvas);
