import initialProject from './initialProject.json';

import initEditor from '../packages/editor/src';

function init() {
	const canvas = <HTMLCanvasElement>document.getElementById('glcanvas');
	initEditor(canvas, initialProject, { isLocalStorageEnabled: false, isDebugMode: false });
}

if (document.readyState === 'complete') {
	init();
} else {
	window.addEventListener('DOMContentLoaded', init);
}
