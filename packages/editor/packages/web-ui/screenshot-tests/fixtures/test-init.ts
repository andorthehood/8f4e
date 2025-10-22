import init from '@8f4e/web-ui';

import type { State } from '@8f4e/editor-state';

// Create a mock state for testing
const mockState: State = {
	editorSettings: {
		font: '8x16',
		colorScheme: 'default',
	},
	colorSchemes: {
		default: {
			background: '#000000',
			foreground: '#ffffff',
			accent: '#00ff00',
		},
	},
	graphicHelper: {
		spriteLookups: {},
		globalViewport: {
			hGrid: 16,
			vGrid: 8,
		},
	},
	featureFlags: {
		infoOverlay: true,
	},
};

// Initialize the web-ui
async function initializeWebUI() {
	const canvas = document.getElementById('test-canvas') as HTMLCanvasElement;
	if (!canvas) {
		throw new Error('Canvas element not found');
	}

	const webUI = await init(mockState, canvas);
	console.log('Web-UI initialized:', webUI);
	return webUI;
}

// Auto-initialize when the module loads
initializeWebUI().catch(console.error);
