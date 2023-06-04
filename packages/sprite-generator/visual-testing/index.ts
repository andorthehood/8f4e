import spriteGenerator from '../src';

(async function () {
	const imageElement: HTMLImageElement = <HTMLImageElement>document.getElementById('sprite-sheet');
	const canvas = await spriteGenerator({
		colorScheme: {
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
				feedbackScale: ['', '', '', ''],
			},
		},
	});
	// @ts-ignore convertToBlob
	const blob = await canvas.convertToBlob();
	console.log(blob);
	const objectURL = URL.createObjectURL(blob);
	imageElement.src = objectURL;
})();
