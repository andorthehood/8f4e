import type { VsCodeApi } from './vscodeApi';

type ResponseMessage = {
	type: 'response';
	id: string;
	ok: boolean;
	payload?: unknown;
	error?: string;
};

type PendingRequest = {
	resolve: (value: unknown) => void;
	reject: (reason?: unknown) => void;
};

export function createRequestBridge(vscode: VsCodeApi): {
	request: <T>(command: string, payload?: Record<string, unknown>) => Promise<T>;
	handleResponse: (message: unknown) => boolean;
} {
	const pendingRequests = new Map<string, PendingRequest>();
	let nextRequestId = 0;

	return {
		request: <T>(command: string, payload: Record<string, unknown> = {}) => {
			const id = `${Date.now()}-${nextRequestId++}`;

			return new Promise<T>((resolve, reject) => {
				pendingRequests.set(id, { resolve: resolve as (value: unknown) => void, reject });
				vscode.postMessage({
					type: 'request',
					id,
					command,
					...payload,
				});
			});
		},

		handleResponse: (message: unknown) => {
			if (!isResponseMessage(message)) {
				return false;
			}

			const request = pendingRequests.get(message.id);
			if (!request) {
				return true;
			}

			pendingRequests.delete(message.id);

			if (message.ok) {
				request.resolve(message.payload);
			} else {
				request.reject(new Error(message.error ?? '8f4e VS Code request failed.'));
			}

			return true;
		},
	};
}

function isResponseMessage(message: unknown): message is ResponseMessage {
	if (!message || typeof message !== 'object') {
		return false;
	}

	const candidate = message as { type?: unknown; id?: unknown; ok?: unknown };
	return candidate.type === 'response' && typeof candidate.id === 'string' && typeof candidate.ok === 'boolean';
}
