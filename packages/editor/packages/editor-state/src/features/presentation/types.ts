export interface PresentationState {
	activeStopIndex: number;
	totalStops: number;
	remainingMs: number;
	currentStopDurationMs: number;
	deadlineAt?: number;
}
