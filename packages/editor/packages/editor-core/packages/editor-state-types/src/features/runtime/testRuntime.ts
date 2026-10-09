import type { AssertionSite } from '@8f4e/language-spec';
import type { TestAssertionResult } from '@8f4e/test-runner';

export type TestRunResult =
	| { status: 'passed' | 'failed'; assertions: TestAssertionResult[]; failures: TestAssertionResult[] }
	| { status: 'error'; error: string };

export type TestRuntimeState =
	| { status: 'idle' }
	| { status: 'running'; assertionSites: AssertionSite[] }
	| (TestRunResult & { assertionSites: AssertionSite[] });
