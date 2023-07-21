import exampleProjects from './exampleProjects';

import initEditor from '../packages/editor/src';

async function init() {
	const canvas = <HTMLCanvasElement>document.getElementById('glcanvas');
	const editor = await initEditor(canvas, exampleProjects.audioBuffer, {
		isLocalStorageEnabled: false,
		isDebugMode: false,
	});
	window.state = editor.state;
}

if (document.readyState === 'complete') {
	init();
} else {
	window.addEventListener('DOMContentLoaded', init);
}
