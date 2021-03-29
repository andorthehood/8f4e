import { SpriteLookup } from 'glugglugglug';
import generateSplitter, { lookup as splitterLookup } from './splitter';

const generate = function (ctx: OffscreenCanvasRenderingContext2D): void {
	generateSplitter(ctx);
};

export default generate;

export const lookup: SpriteLookup = function (name: string) {
	switch (name) {
		default:
			return splitterLookup();
	}
};
