import type { AssertionSite, ProjectObjectModel } from '@8f4e/language-spec';
import { ASSERTION_IMPORT_NAMES, WASM_MEMORY_PAGE_SIZE } from '@8f4e/language-spec';

export type { AssertionSite } from '@8f4e/language-spec';

/** Minimum compiler output needed to execute a test project. Assertions must be enabled. */
export interface TestCompilation {
	codeBuffer: Uint8Array;
	requiredMemoryBytes: number;
	requiredMemoryBytesByRegion?: Record<string, number>;
	assertionSites?: AssertionSite[];
}

interface AssertionInvocation {
	assertIndex: number;
	site: AssertionSite;
	passed: boolean;
}

/** One runtime invocation; loops can produce several results for the same static site. */
export type TestAssertionResult = AssertionInvocation &
	({ instruction: 'assert'; condition: number } | { instruction: 'assertEqual'; received: number; expected: number });

/** Serializable results, including static sites that were never executed. */
export interface TestReport {
	assertionSites: AssertionSite[];
	assertionCount: number;
	assertions: TestAssertionResult[];
	failures: TestAssertionResult[];
}

export interface TestRunResult<T extends TestCompilation> extends TestReport {
	compileResult: T;
	instance: WebAssembly.Instance;
	host: Record<string, WebAssembly.Memory | CallableFunction>;
}

export interface TestRunOptions<T extends TestCompilation> {
	compile: (
		project: ProjectObjectModel,
		options: { enableAssertions: true; disableSharedMemory: true }
	) => T | Promise<T>;
}

/** Collecting callbacks return normally so a failure does not prevent later assertions. */
export function createAssertionCollector(assertionSites: AssertionSite[]) {
	const assertions: TestAssertionResult[] = [];
	function getSite(siteId: number): AssertionSite {
		const site = assertionSites[siteId];
		if (!site) throw new Error(`Assertion reported an unknown site ID: ${siteId}`);
		return site;
	}
	const equal = (received: number, expected: number, siteId: number) => {
		assertions.push({
			instruction: 'assertEqual',
			assertIndex: assertions.length,
			site: getSite(siteId),
			received,
			expected,
			passed: received === expected,
		});
	};
	return {
		imports: {
			[ASSERTION_IMPORT_NAMES.assert]: (condition: number, siteId: number) => {
				assertions.push({
					instruction: 'assert',
					assertIndex: assertions.length,
					site: getSite(siteId),
					condition,
					passed: condition !== 0,
				});
			},
			[ASSERTION_IMPORT_NAMES.assertEqual.int]: equal,
			[ASSERTION_IMPORT_NAMES.assertEqual.float]: equal,
			[ASSERTION_IMPORT_NAMES.assertEqual.float64]: equal,
		},
		getReport: (): TestReport => ({
			assertionSites,
			assertionCount: assertions.length,
			assertions: [...assertions],
			failures: assertions.filter(assertion => !assertion.passed),
		}),
	};
}

/** Detects an enabled test entry or a root function exported as `test`. */
export function hasTestEntry(project: ProjectObjectModel): boolean {
	function hasTestModules(project: ProjectObjectModel): boolean {
		return (
			project.modules.some(block => !block.disabled && block.entry === 'test') || project.groups.some(hasTestModules)
		);
	}
	return (
		hasTestModules(project) ||
		project.functions.some(block => {
			if (block.disabled) return false;
			const [openingLine, ...body] = block.code.map(line => line.split(';')[0].trim());
			return body.some(line => line === '#export test' || (openingLine === 'function test' && line === '#export'));
		})
	);
}

function createMemory(requiredMemoryBytes: number): WebAssembly.Memory {
	const pages = Math.max(1, Math.ceil(requiredMemoryBytes / WASM_MEMORY_PAGE_SIZE));
	return new WebAssembly.Memory({ initial: pages, maximum: pages });
}

function getExportedFunction(instance: WebAssembly.Instance, name: string): CallableFunction {
	const exported = instance.exports[name];
	if (typeof exported !== 'function')
		throw new Error(`Expected compiled test WebAssembly to export function "${name}"`);
	return exported;
}

/** Compile the original project, initialize fresh non-shared memory once, and execute its test entry. */
export async function runTestProject<T extends TestCompilation>(
	project: ProjectObjectModel,
	options: TestRunOptions<T>
): Promise<TestRunResult<T>> {
	const compileResult = await options.compile(project, { enableAssertions: true, disableSharedMemory: true });
	if (!compileResult.assertionSites) throw new Error('Test compilation requires enableAssertions: true');
	const collector = createAssertionCollector(compileResult.assertionSites);
	const host = {
		memory: createMemory(compileResult.requiredMemoryBytes),
		...Object.fromEntries(
			Object.entries(compileResult.requiredMemoryBytesByRegion ?? {}).map(([name, bytes]) => [
				name,
				createMemory(bytes),
			])
		),
		...collector.imports,
	};
	const { instance } = await WebAssembly.instantiate(new Uint8Array(compileResult.codeBuffer), { host });
	getExportedFunction(instance, 'initDefaults')();
	getExportedFunction(instance, 'test')();
	return { compileResult, instance, host, ...collector.getReport() };
}

/** Formats a failure with a one-based physical line within the original block. */
export function formatAssertionFailure(failure: TestAssertionResult): string {
	const { site } = failure;
	const name = site.projectGroupPath ? `${site.projectGroupPath}/${site.codeBlockId}` : site.codeBlockId;
	const expectation =
		failure.instruction === 'assert'
			? `expected nonzero, received ${failure.condition}`
			: `expected ${failure.expected}, received ${failure.received}`;
	const source = site.source ? `, include ${site.source.includeId} (${site.source.symbolName})` : '';
	return `${failure.instruction} #${failure.assertIndex} ${expectation} at ${site.codeBlockType} ${name}, block line ${site.lineNumber + 1}${source} (site ${site.siteId})`;
}

export function formatTestFailures(failures: TestAssertionResult[]): string {
	return [
		`${failures.length} assertion${failures.length === 1 ? '' : 's'} failed:`,
		...failures.map(failure => `  ${formatAssertionFailure(failure)}`),
	].join('\n');
}
