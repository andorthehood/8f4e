import exampleProjects from './examples/projects';
import exampleModules from './examples/modules';

import initEditor from '../packages/editor/src';
import { Project } from '../packages/editor/src/state/types';

const kebabCaseToCamelCase = (str: string) =>
	str.replace(/-([a-z])/g, function (g) {
		return g[1].toUpperCase();
	});

async function init() {
	const projectName = kebabCaseToCamelCase(location.hash.match(/#\/([a-z-]*)/)?.[1] || '');
	const project: Project = exampleProjects[projectName] || exampleProjects.audioBuffer;

	const canvas = <HTMLCanvasElement>document.getElementById('glcanvas');
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	const editor = await initEditor(canvas, project, {
		isLocalStorageEnabled: true,
		isDebugMode: false,
		localStorageId: 'editor',
		exampleProjects,
		exampleModules,
	});

	// @ts-ignore
	window.state = editor.state;

	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	editor.resize(window.innerWidth, window.innerHeight);

	window.addEventListener('resize', () => {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		editor.resize(window.innerWidth, window.innerHeight);
	});
}

if (document.readyState === 'complete') {
	init();
} else {
	window.addEventListener('DOMContentLoaded', init);
}
