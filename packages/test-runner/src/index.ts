import type { ProjectBlock, ProjectGroupPath, ProjectObjectModel } from '@8f4e/language-spec';
import {
	createChildProjectGroupPath,
	POINTER_FUNCTION_TYPE_IDENTIFIERS,
	ROOT_PROJECT_GROUP_PATH,
	WASM_MEMORY_PAGE_SIZE,
} from '@8f4e/language-spec';
import { type AssertionSite, precompileTestProject } from '@8f4e/test-precompiler';

export type { AssertionSite } from '@8f4e/test-precompiler';

/** Minimum compiler output needed to execute a test project. */
export interface TestCompilation {
	codeBuffer: Uint8Array;
	requiredMemoryBytes: number;
	requiredMemoryBytesByRegion?: Record<string, number>;
}

/** One runtime invocation; loops can produce several results for the same static site. */
export interface TestAssertionResult {
	assertIndex: number;
	site: AssertionSite;
	received: number;
	expected: number;
	passed: boolean;
}

export interface TestRunResult<T extends TestCompilation> {
	compileResult: T;
	instance: WebAssembly.Instance;
	host: Record<string, WebAssembly.Memory | CallableFunction>;
	assertionSites: AssertionSite[];
	assertionCount: number;
	assertions: TestAssertionResult[];
	failures: TestAssertionResult[];
}

export interface TestRunOptions<T extends TestCompilation> {
	/** Compile the instrumented project with non-shared memory and any caller-specific include/region options. */
	compile: (project: ProjectObjectModel) => T | Promise<T>;
}

const FLOAT_ASSERT_TOLERANCE = 0.001;

function createAssertionFunctions(): ProjectBlock[] {
	return ['int', 'float', 'float64', ...POINTER_FUNCTION_TYPE_IDENTIFIERS].map((type, index) => ({
		id: -1 - index,
		code: [
			'function assert',
			'#import assert',
			`param ${type} received`,
			`param ${type} expected`,
			'param int siteId',
			'functionEnd',
		],
	}));
}

function addAssertionFunctions(
	project: ProjectObjectModel,
	scopes: ReadonlySet<ProjectGroupPath>,
	groupPath = ROOT_PROJECT_GROUP_PATH
): ProjectObjectModel {
	return {
		...project,
		functions: [...project.functions, ...(scopes.has(groupPath) ? createAssertionFunctions() : [])],
		groups: project.groups.map(group => ({
			...group,
			...addAssertionFunctions(group, scopes, createChildProjectGroupPath(groupPath, group.name)),
		})),
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
	if (typeof exported !== 'function') {
		throw new Error(`Expected compiled test WebAssembly to export function "${name}"`);
	}
	return exported;
}

/** Instruments, compiles, initializes, and executes one test project without mutating its source. */
export async function runTestProject<T extends TestCompilation>(
	project: ProjectObjectModel,
	options: TestRunOptions<T>
): Promise<TestRunResult<T>> {
	const precompiled = precompileTestProject(project);
	const scopes = new Set(precompiled.assertionSites.map(site => site.projectGroupPath));
	const compileResult = await options.compile(addAssertionFunctions(precompiled.project, scopes));
	const assertions: TestAssertionResult[] = [];
	const host = {
		memory: createMemory(compileResult.requiredMemoryBytes),
		...Object.fromEntries(
			Object.entries(compileResult.requiredMemoryBytesByRegion ?? {}).map(([name, bytes]) => [
				name,
				createMemory(bytes),
			])
		),
		assert(received: number, expected: number, siteId: number) {
			const site = precompiled.assertionSites[siteId];
			if (!site) throw new Error(`Assertion reported an unknown site ID: ${siteId}`);
			assertions.push({
				assertIndex: assertions.length,
				site,
				received,
				expected,
				passed: Math.abs(received - expected) <= FLOAT_ASSERT_TOLERANCE,
			});
		},
	};
	const { instance } = await WebAssembly.instantiate(new Uint8Array(compileResult.codeBuffer), { host });
	getExportedFunction(instance, 'initDefaults')();
	getExportedFunction(instance, 'test')();
	return {
		compileResult,
		instance,
		host,
		assertionSites: precompiled.assertionSites,
		assertionCount: assertions.length,
		assertions,
		failures: assertions.filter(assertion => !assertion.passed),
	};
}

/** Formats a failure with a one-based line within the original module/function block. */
export function formatAssertionFailure(failure: TestAssertionResult): string {
	const { site } = failure;
	const name = site.projectGroupPath ? `${site.projectGroupPath}/${site.codeBlockId}` : site.codeBlockId;
	return `assert #${failure.assertIndex} expected ${failure.expected}, received ${failure.received} at ${site.codeBlockType} ${name}, block line ${site.lineNumber + 1} (site ${site.siteId})`;
}

export function formatTestFailures(failures: TestAssertionResult[]): string {
	return [
		`${failures.length} assertion${failures.length === 1 ? '' : 's'} failed:`,
		...failures.map(failure => `  ${formatAssertionFailure(failure)}`),
	].join('\n');
}
