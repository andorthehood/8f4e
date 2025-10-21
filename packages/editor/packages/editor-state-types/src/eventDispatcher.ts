// EventDispatcher type - complete definition for event management
export interface EventDispatcher {
	on: <T>(eventName: string, callback: (event: T) => void) => void;
	off: <T>(eventName: string, callback: (event: T) => void) => void;
	dispatch: <T>(eventName: string, eventObject?: T) => void;
}

// Event types for user interactions
export interface InternalMouseEvent {
	x: number;
	y: number;
	movementX: number;
	movementY: number;
	buttons: number;
	stopPropagation: boolean;
	canvasWidth: number;
	canvasHeight: number;
}

export interface InternalKeyboardEvent {
	key: string;
}
