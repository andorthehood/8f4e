import initEditor, { type Project, type RuntimeFactory, type RuntimeType, type EditorSettings } from '@8f4e/editor';

// Import the registry functions instead of static imports
import { getListOfModules, getModule, getListOfProjects, getProject, projectRegistry } from './examples/registry';
// Import the runtime factory functions from separate dedicated files
import { audioWorkletRuntime } from './audio-worklet-runtime-factory';
import { webWorkerLogicRuntime } from './web-worker-logic-runtime-factory';
import { webWorkerMIDIRuntime } from './web-worker-midi-runtime-factory';

// Runtime factory registry - this demonstrates how consumers can implement the requestRuntime callback
const runtimeFactories: Record<RuntimeType, RuntimeFactory> = {
	AudioWorkletRuntime: audioWorkletRuntime,
	WebWorkerLogicRuntime: webWorkerLogicRuntime,
	WebWorkerMIDIRuntime: webWorkerMIDIRuntime,
};

// Implementation of storage callbacks using localStorage
async function loadProjectFromStorage(storageId: string): Promise<Project | null> {
	try {
		const stored = localStorage.getItem('project_' + storageId);
		return stored ? JSON.parse(stored) : null;
	} catch (error) {
		console.error('Failed to load project from localStorage:', error);
		return null;
	}
}

async function saveProjectToStorage(storageId: string, project: Project): Promise<void> {
	try {
		localStorage.setItem('project_' + storageId, JSON.stringify(project));
	} catch (error) {
		console.error('Failed to save project to localStorage:', error);
		throw error;
	}
}

async function loadEditorSettingsFromStorage(storageId: string): Promise<EditorSettings | null> {
	try {
		const stored = localStorage.getItem('editorSettings_' + storageId);
		return stored ? JSON.parse(stored) : null;
	} catch (error) {
		console.error('Failed to load editor settings from localStorage:', error);
		return null;
	}
}

async function saveEditorSettingsToStorage(storageId: string, settings: EditorSettings): Promise<void> {
	try {
		localStorage.setItem('editorSettings_' + storageId, JSON.stringify(settings));
	} catch (error) {
		console.error('Failed to save editor settings to localStorage:', error);
		throw error;
	}
}

// Implementation of file handling callbacks using browser APIs
async function loadProjectFromFile(file: File): Promise<Project> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = (event) => {
			try {
				const content = event.target?.result as string;
				const project = JSON.parse(content);
				resolve(project);
			} catch (error) {
				reject(new Error('Failed to parse project file: ' + error));
			}
		};
		reader.onerror = () => reject(new Error('Failed to read file'));
		reader.readAsText(file, 'UTF-8');
	});
}

async function saveProjectToFile(project: Project, filename: string): Promise<void> {
	const json = JSON.stringify(project, null, 2);
	const blob = new Blob([json], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	
	const a = document.createElement('a');
	document.body.appendChild(a);
	a.style.display = 'none';
	a.href = url;
	a.download = filename;
	a.click();
	
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

async function importBinaryAsset(file: File): Promise<{ data: string; fileName: string }> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = (event) => {
			try {
				const dataUrl = event.target?.result as string;
				const base64data = dataUrl.split(',')[1];
				resolve({ data: base64data, fileName: file.name });
			} catch (error) {
				reject(new Error('Failed to process binary asset: ' + error));
			}
		};
		reader.onerror = () => reject(new Error('Failed to read binary asset file'));
		reader.readAsDataURL(file);
	});
}

// Implementation of the requestRuntime callback
async function requestRuntime(runtimeType: RuntimeType): Promise<RuntimeFactory> {
	const factory = runtimeFactories[runtimeType];
	if (!factory) {
		throw new Error(`Unknown runtime type: ${runtimeType}`);
	}

	console.log(`[App] Providing runtime factory for: ${runtimeType}`);
	return factory;
}

const kebabCaseToCamelCase = (str: string) =>
	str.replace(/-([a-z])/g, function (g) {
		return g[1].toUpperCase();
	});

async function init() {
	const projectName = kebabCaseToCamelCase(location.hash.match(/#\/([a-z-]*)/)?.[1] || '');
	// Use the registry to get the default project instead of direct access
	let project: Project;
	if (projectName && projectRegistry[projectName]) {
		project = await getProject(projectName);
	} else {
		project = await getProject('audioBuffer'); // Default project
	}

	const canvas = <HTMLCanvasElement>document.getElementById('glcanvas');
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	const editor = await initEditor(canvas, project, {
		featureFlags: {
			persistentStorage: true,
			infoOverlay: true,
		},
		localStorageId: 'editor',
		getListOfModules,
		getModule,
		getListOfProjects,
		getProject,
		requestRuntime, // Add the runtime callback
		// Add storage and file handling callbacks
		loadProjectFromStorage,
		saveProjectToStorage,
		loadEditorSettingsFromStorage,
		saveEditorSettingsToStorage,
		loadProjectFromFile,
		saveProjectToFile,
		importBinaryAsset,
	});

	// @ts-expect-error
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
