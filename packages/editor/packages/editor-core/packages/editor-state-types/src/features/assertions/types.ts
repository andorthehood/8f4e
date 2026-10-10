import type { AssertionSite } from '@8f4e/language-spec';

/** An executed assertion's source location and outcome, independent of the runtime that produced it. */
export interface AssertionResult {
	site: AssertionSite;
	passed: boolean;
	/** Optional failure details supplied by the runtime for inline error reporting. */
	message?: string;
}
