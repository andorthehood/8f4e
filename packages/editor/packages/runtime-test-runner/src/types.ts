import type { AssertionSite } from '@8f4e/language-spec';
import type { TestProgram } from '@8f4e/test-runner';

export interface TestRuntimeProgram extends TestProgram {
	assertionSites: AssertionSite[];
	memory: WebAssembly.Memory;
}
