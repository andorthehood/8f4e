export interface DialogButton {
	title: string;
	action: string;
	payload?: unknown;
}

export interface DialogContent {
	id: string;
	text: string;
	title: string;
	buttons: DialogButton[];
}

export interface DialogState extends DialogContent {
	wrappedText: string[];
	width: number;
	height: number;
	x: number;
	y: number;
}
