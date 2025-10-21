// EventDispatcher type - minimal definition needed for RuntimeFactory
export interface EventDispatcher {
	dispatch: (event: string, payload?: unknown) => void;
	on: (event: string, callback: (payload?: unknown) => void) => void;
}
