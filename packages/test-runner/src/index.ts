import type { AssertionSite, CompileResult, ProjectObjectModel } from '@8f4e/language-spec';
import { ASSERTION_IMPORT_NAMES, WASM_MEMORY_PAGE_SIZE } from '@8f4e/language-spec';

export { IGNORED_ASSERTION_IMPORTS } from './ignoredAssertionImports';

/** One invocation; loops can execute the same static site several times. */
export type TestAssertionResult = {
	assertIndex: number;
	site: AssertionSite;
	passed: boolean;
} & ({ condition: number } | { received: number; expected: number });

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

/** Initialize fresh non-shared memory once and execute an already compiled test. */
export async function runTests(compiled: CompileResult) {
	const sites = compiled.assertionSites;
	if (!sites) throw new Error('Test compilation requires enableAssertions: true');
	const assertions: TestAssertionResult[] = [];
	const equal = (received: number, expected: number, siteId: number) => {
		assertions.push({
			assertIndex: assertions.length,
			site: sites[siteId]!,
			received,
			expected,
			passed: received === expected,
		});
	};
	const memories = {
		memory: createMemory(compiled.requiredMemoryBytes),
		...Object.fromEntries(
			Object.entries(compiled.requiredMemoryBytesByRegion ?? {}).map(([name, bytes]) => [name, createMemory(bytes)])
		),
	};
	const host = {
		...memories,
		[ASSERTION_IMPORT_NAMES.assert]: (condition: number, siteId: number) => {
			assertions.push({ assertIndex: assertions.length, site: sites[siteId]!, condition, passed: condition !== 0 });
		},
		[ASSERTION_IMPORT_NAMES.assertEqual.int]: equal,
		[ASSERTION_IMPORT_NAMES.assertEqual.float]: equal,
		[ASSERTION_IMPORT_NAMES.assertEqual.float64]: equal,
	};
	const { instance } = await WebAssembly.instantiate(new Uint8Array(compiled.codeBuffer), { host });
	getExportedFunction(instance, 'initDefaults')();
	getExportedFunction(instance, 'test')();
	return { instance, memories, assertions, failures: assertions.filter(assertion => !assertion.passed) };
}

/** Formats a failure with a one-based physical line within the original block. */
function formatAssertionFailure(failure: TestAssertionResult): string {
	const { site } = failure;
	const name = site.projectGroupPath ? `${site.projectGroupPath}/${site.codeBlockId}` : site.codeBlockId;
	const expectation =
		'condition' in failure
			? `expected nonzero, received ${failure.condition}`
			: `expected ${failure.expected}, received ${failure.received}`;
	const source = site.source ? `, include ${site.source.includeId} (${site.source.symbolName})` : '';
	return `${site.instruction} #${failure.assertIndex} ${expectation} at ${site.codeBlockType} ${name}, block line ${site.lineNumber + 1}${source} (site ${site.siteId})`;
}

export function formatTestFailures(failures: TestAssertionResult[]): string {
	return [
		`${failures.length} assertion${failures.length === 1 ? '' : 's'} failed:`,
		...failures.map(failure => `  ${formatAssertionFailure(failure)}`),
	].join('\n');
}
