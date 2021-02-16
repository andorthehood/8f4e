import { SpriteLookup } from '../../engine';
import generateQuantizer, { lookup as quantizerLookup } from './quantizer';
import generateSplitter, { lookup as splitterLookup } from './splitter';

const generate = function (ctx: OffscreenCanvasRenderingContext2D): void {
	generateQuantizer(ctx);
	generateSplitter(ctx);
};

export default generate;

export const lookup: SpriteLookup = function (name: string) {
	switch (name) {
		case 'splitter':
			return splitterLookup();
		case 'quantizer':
			return quantizerLookup();
		default:
			return splitterLookup();
	}
};
