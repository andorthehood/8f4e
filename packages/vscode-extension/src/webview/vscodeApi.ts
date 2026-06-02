export interface VsCodeApi {
	postMessage(message: unknown): void;
}

declare global {
	function acquireVsCodeApi(): VsCodeApi;
}

export function getVsCodeApi(): VsCodeApi {
	return acquireVsCodeApi();
}
