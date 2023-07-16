import spriteGenerator from '../src';

(async function () {
	const imageElement: HTMLImageElement = <HTMLImageElement>document.getElementById('sprite-sheet');
	const { canvas, spriteLookups } = spriteGenerator({
		font: '8x16',
		colorScheme: {
			text: {
				lineNumber: 'rgba(51,51,51,255)',
				instruction: 'rgba(136,126,203,255)',
				codeComment: 'rgba(102,102,102,255)',
				code: 'rgba(255,255,255,255)',
				numbers: 'rgba(201,212,135,255)',
				menuItemText: 'rgba(255,255,255,255)',
				menuItemTextHighlighted: 'rgba(0,0,0,255)',
				dialogText: 'rgba(255,255,255,255)',
				dialogTitle: 'rgba(255,255,255,255)',
				binaryZero: 'rgba(201,212,135,255)',
				binaryOne: 'rgba(201,212,135,255)',
			},
			fill: {
				menuItemBackground: 'rgba(0,0,0,255)',
				menuItemBackgroundHighlighted: 'rgba(255,255,255,255)',
				background: '#000000',
				backgroundDots: '#999999',
				moduleBackground: '#000000',
				moduleBackgroundDragged: 'rgba(0,0,0,0.8)',
				wire: '#ffffff',
				wireHighlighted: '#ffffff',
				errorMessageBackground: '#ff0000',
				dialogBackground: 'rgba(0,0,0,1)',
				dialogDimmer: 'rgba(0,0,0,0.5)',
				highlightedCodeLine: '#333333',
			},
			icons: {
				outputConnectorBackground: '#111111',
				inputConnectorBackground: '#111111',
				inputConnector: '#ffffff',
				outputConnector: '#ffffff',
				feedbackScale: ['#ff0000', '#cc0033', '#990066', '#660099', '#3300cc', '#0000ff'],
			},
		},
	});

	spriteLookups;

	// @ts-ignore convertToBlob
	const blob = await canvas.convertToBlob();
	console.log(blob);
	const objectURL = URL.createObjectURL(blob);
	imageElement.src = objectURL;
})();
