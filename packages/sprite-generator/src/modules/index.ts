import { SpriteLookup } from '../../../2d-engine/src';
import generateSplitter, { lookup as splitterLookup } from './splitter';

export default function generate(ctx: OffscreenCanvasRenderingContext2D): void {
	generateSplitter(ctx);
}

export const lookup: SpriteLookup = function (name: string) {
	switch (name) {
		default:
			return splitterLookup();
	}
};
