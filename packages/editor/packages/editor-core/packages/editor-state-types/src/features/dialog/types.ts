import type { Position, Size } from '../../shared/types';

export interface DialogButton {
	title: string;
	action?: string;
	payload?: unknown;
	close?: boolean;
}

export type DialogButtonState = DialogButton & Position & Size;

export interface DialogContent {
	id: string;
	text: string;
	title: string;
	buttons: DialogButton[];
}

export interface DialogState extends Omit<DialogContent, 'buttons'> {
	wrappedText: string[];
	buttons: DialogButtonState[];
	highlightedButton: number;
	width: number;
	height: number;
	x: number;
	y: number;
}
