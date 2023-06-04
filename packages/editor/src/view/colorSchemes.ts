import { ColorScheme } from '@8f4e/sprite-generator';

const colorSchemes: Record<string, ColorScheme> = {
	default: {
		text: {
			lineNumber: 'rgba(51,51,51,255)',
			instruction: 'rgba(136,126,203,255)',
			codeComment: 'rgba(102,102,102,255)',
			code: 'rgba(255,255,255,255)',
			numbers: 'rgba(201,212,135,255)',
			menuItemText: 'rgba(255,255,255,255)',
			menuItemTextHighlighted: 'rgba(0,0,0,255)',
		},
		fill: {
			menuItemBackground: 'rgba(0,0,0,255)',
			menuItemBackgroundHighlighted: 'rgba(255,255,255,255)',
			background: '#000000',
			backgroundDots: '#999999',
			moduleBackground: '#000000',
			wire: '',
		},
		icons: {
			inputConnector: '#ffffff',
			outputConnector: '#ffffff',
			feedbackScale: ['#ff0000', '#cc0033', '#990066', '#660099', '#3300cc', '#0000ff'],
		},
	},
	vector: {
		text: {
			lineNumber: '#006600',
			instruction: '#99ff99',
			codeComment: '#006600',
			code: '#00cc00',
			numbers: '#00ff00',
			menuItemText: '#00ff00',
			menuItemTextHighlighted: '#000000',
		},
		fill: {
			menuItemBackground: 'rgba(0,0,0,255)',
			menuItemBackgroundHighlighted: 'rgba(255,255,255,255)',
			background: '#000000',
			backgroundDots: '#006600',
			moduleBackground: '#000000',
			wire: '',
		},
		icons: {
			inputConnector: '#ffffff',
			outputConnector: '#ffffff',
			feedbackScale: ['#ff0000', '#cc0033', '#990066', '#660099', '#3300cc', '#0000ff'],
		},
	},
};

export default colorSchemes;
