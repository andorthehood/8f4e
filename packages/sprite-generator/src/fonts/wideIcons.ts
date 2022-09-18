import { same } from './utils';

export default [
	[...same(0b11111111, 2), ...same(0b11000000, 14)],
	[...same(0b11111111, 2), ...same(0b00000000, 14)],
].flat();

export enum WideIcon {
	CORNER_TOP_LEFT,
}
