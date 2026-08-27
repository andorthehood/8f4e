import type { CompilerDiagnostic } from '@8f4e/language-spec';
import { describe, expect, it, vi } from 'vitest';
import { createIncludeSourceRequestBroker } from '../includeSourceRequestBroker';
import type { ResolveIncludeRequestMessage } from '../messages';

describe('createIncludeSourceRequestBroker', () => {
	it('resolves the matching request with the browser source', async () => {
		const postMessage = vi.fn<(message: ResolveIncludeRequestMessage) => void>();
		const broker = createIncludeSourceRequestBroker(postMessage);
		const sourcePromise = broker.request('std/math/sine');

		expect(postMessage).toHaveBeenCalledWith({
			type: 'resolveInclude',
			payload: { requestId: 0, includeId: 'std/math/sine' },
		});
		broker.finish({
			type: 'resolveIncludeResult',
			payload: { requestId: 0, source: 'function sine\nfunctionEnd' },
		});

		await expect(sourcePromise).resolves.toBe('function sine\nfunctionEnd');
	});

	it('rejects the matching request with the browser diagnostic', async () => {
		const broker = createIncludeSourceRequestBroker(vi.fn());
		const sourcePromise = broker.request('std/missing');
		const error: CompilerDiagnostic = {
			code: -1,
			message: 'loading failed',
			line: { lineNumber: 0 },
			context: {},
		};

		broker.finish({
			type: 'resolveIncludeResult',
			payload: { requestId: 0, error },
		});

		await expect(sourcePromise).rejects.toBe(error);
	});
});
