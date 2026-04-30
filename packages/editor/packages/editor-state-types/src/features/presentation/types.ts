export interface PresentationState {
	canPresent: boolean;
	activeStopIndex: number;
	totalStops: number;
	remainingMs: number;
	currentStopDurationMs: number;
	deadlineAt?: number;
}
