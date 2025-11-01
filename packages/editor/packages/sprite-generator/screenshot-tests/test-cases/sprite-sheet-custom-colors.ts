import spriteGenerator from '@8f4e/sprite-generator';

(async function () {
	const canvasElement = document.getElementById('test-canvas') as HTMLCanvasElement;
	const { canvas, spriteLookups } = spriteGenerator({
		font: '6x10',
		colorScheme: {
			text: {
				lineNumber: 'rgba(255,0,0,255)',
				instruction: 'rgba(0,255,0,255)',
				codeComment: 'rgba(0,0,255,255)',
				code: 'rgba(255,255,0,255)',
				numbers: 'rgba(255,0,255,255)',
				menuItemText: 'rgba(0,255,255,255)',
				menuItemTextHighlighted: 'rgba(128,128,128,255)',
				dialogText: 'rgba(255,128,0,255)',
				dialogTitle: 'rgba(128,255,0,255)',
				binaryZero: 'rgba(0,128,255,255)',
				binaryOne: 'rgba(255,0,128,255)',
			},
			fill: {
				menuItemBackground: 'rgba(32,32,32,255)',
				menuItemBackgroundHighlighted: 'rgba(200,200,200,255)',
				background: '#111111',
				backgroundDots: '#444444',
				backgroundDots2: '#666666',
				moduleBackground: '#222222',
				moduleBackgroundDragged: 'rgba(40,40,40,0.9)',
				wire: '#00ff00',
				wireHighlighted: '#ffff00',
				errorMessageBackground: '#880000',
				dialogBackground: 'rgba(20,20,40,1)',
				dialogDimmer: 'rgba(10,10,10,0.7)',
				highlightedCodeLine: '#404040',
				plotterBackground: '#001100',
				plotterTrace: '#00ff00',
			},
			icons: {
				outputConnectorBackground: '#220022',
				inputConnectorBackground: '#002200',
				switchBackground: '#006699',
				inputConnector: '#00ffff',
				outputConnector: '#ff00ff',
				feedbackScale: ['#ff0000', '#ff8800', '#ffff00', '#00ff00', '#0088ff', '#0000ff'],
				arrow: '#ffffff',
				pianoKeyWhite: '#eeeeee',
				pianoKeyWhiteHighlighted: '#00ff00',
				pianoKeyWhitePressed: '#aaaaaa',
				pianoKeyBlack: '#111111',
				pianoKeyBlackHighlighted: '#00ff00',
				pianoKeyBlackPressed: '#444444',
				pianoKeyboardBackground: '#666666',
				pianoKeyboardNote: '#00ffff',
				pianoKeyboardNoteHighlighted: '#00ff00',
			},
		},
	});

	void spriteLookups;

	const ctx = canvasElement.getContext('2d');
	if (ctx) {
		const blob = await canvas.convertToBlob();
		const img = new Image();
		const objectURL = URL.createObjectURL(blob);
		
		img.onload = () => {
			ctx.imageSmoothingEnabled = false;
			ctx.drawImage(img, 0, 0);
			URL.revokeObjectURL(objectURL);
		};
		
		img.src = objectURL;
	}
})();
