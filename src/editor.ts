import initEditor, { type Project } from '@8f4e/editor';

import exampleProjects from './examples/projects';
import exampleModules from './examples/modules';

const kebabCaseToCamelCase = (str: string) =>
	str.replace(/-([a-z])/g, function (g) {
		return g[1].toUpperCase();
	});

async function init() {
	const projectName = kebabCaseToCamelCase(location.hash.match(/#\/([a-z-]*)/)?.[1] || '');

	// Load the specific project needed (this will be lazy loaded)
	// Fall back to audioBuffer if the project name is not found
	const projectWrapper = exampleProjects[projectName as keyof typeof exampleProjects] || exampleProjects.audioBuffer;
	const project: Project = await projectWrapper.load();

	const canvas = <HTMLCanvasElement>document.getElementById('glcanvas');
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	const editor = await initEditor(canvas, project, {
		isLocalStorageEnabled: true,
		showInfoOverlay: true,
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
