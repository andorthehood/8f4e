import number from '../../../src/modules/midiNote';

export enum Command {
	FILL_COLOR,
	RECTANGLE,
	TRANSLATE,
	RESET_TRANSFORM,
}

export type DrawingCommand =
	| [command: Command.FILL_COLOR, fillColor: string]
	| [command: Command.RECTANGLE, x: number, y: number, width: number, height: number]
	| [command: Command.TRANSLATE, x: number, y: number]
	| [command: Command.RESET_TRANSFORM];
