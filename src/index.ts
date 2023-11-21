import { State } from '@8f4e/editor/src/state/types';

import exampleProjects from './examples/projects';

import initEditor from '../packages/editor/src';

declare global {
	interface Window {
		state: State;
	}
}

async function init() {
	const canvas = <HTMLCanvasElement>document.getElementById('glcanvas');
	const editor = await initEditor(canvas, exampleProjects.audioBuffer, {
		isLocalStorageEnabled: false,
		isDebugMode: false,
	});
	window.state = editor.state;

	editor.resize(canvas.clientWidth, canvas.clientHeight);
}

if (document.readyState === 'complete') {
	init();
} else {
	window.addEventListener('DOMContentLoaded', init);
}
