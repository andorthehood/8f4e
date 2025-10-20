// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type Path<State> = string & Record<never, never>;

export type PathValue<State, P extends string> = P extends `${infer K}.${infer Rest}`
	? K extends keyof State
		? PathValue<State[K], Rest>
		: unknown
	: P extends keyof State
		? State[P]
		: unknown;

export type Subscription<State, P extends Path<State> = Path<State>> = {
	selector: P;
	tokens: string[];
	callback: (value: PathValue<State, P>) => void;
};
