import { compileProject } from '@8f4e/compiler';
import { createMockCodeBlock, createMockState } from '@8f4e/editor-state-testing';
import type { TestRuntimeState } from '@8f4e/editor-state-types';
import type { AssertionSite } from '@8f4e/language-spec';
import type { TestAssertionResult } from '@8f4e/test-runner';
import { runTests } from '@8f4e/test-runner';
import { describe, expect, it } from 'vitest';
import convertGraphicDataToProjectStructure from '../../../project-export/serializeCodeBlocks';
import buildDisplayModel from '../../buildDisplayModel';
import deriveAssertionMarkers from './deriveAssertionMarkers';

const code = ['module checks', 'push 1', 'assert', 'push 2', 'assertEqual 2', 'moduleEnd'];

function site(overrides: Partial<AssertionSite> = {}): AssertionSite {
	return {
		siteId: 0,
		instruction: 'assert',
		projectBlockId: 7,
		projectGroupPath: 'audio',
		codeBlockType: 'module',
		codeBlockId: 'checks',
		lineNumber: 2,
		...overrides,
	};
}

function invocation(site: AssertionSite, passed = true, assertIndex = 0): TestAssertionResult {
	return { site, passed, assertIndex, condition: passed ? 1 : 0 };
}

function completed(assertions: TestAssertionResult[]): Extract<TestRuntimeState, { status: 'passed' | 'failed' }> {
	const failures = assertions.filter(assertion => !assertion.passed);
	return {
		status: failures.length ? 'failed' : 'passed',
		assertions,
		failures,
		assertionSites: assertions.map(assertion => assertion.site),
	};
}

function setup() {
	const block = createMockCodeBlock({
		code,
		blockType: 'module',
		creationIndex: 7,
		projectPath: 'audio',
		lineNumberColumnWidth: 2,
	});
	const state = createMockState({ viewport: { vGrid: 8, hGrid: 16 } });
	return { block, state };
}

describe('assertion marker derivation', () => {
	it('maps real compiler assertion sites back to editor-owned blocks', async () => {
		const { block, state } = setup();
		block.entry = 'test';
		block.projectPath = '';
		const compiled = await compileProject(convertGraphicDataToProjectStructure([block]), {
			enableAssertions: true,
			disableSharedMemory: true,
		});
		const result = await runTests(compiled);
		state.runtime.values.TestRuntime = completed(result.assertions);
		expect(deriveAssertionMarkers(block, state)).toEqual([
			{ lineNumber: 2, passed: true, x: 8, y: 32, width: 16, height: 16 },
			{ lineNumber: 4, passed: true, x: 8, y: 64, width: 16, height: 16 },
		]);
	});
	it('aggregates repeated calls with failure taking precedence and omits unexecuted sites', () => {
		const { block, state } = setup();
		const failedSite = site();
		const passedSite = site({ siteId: 1, instruction: 'assertEqual', lineNumber: 4 });
		state.runtime.values.TestRuntime = completed([
			invocation(failedSite, true, 0),
			invocation(failedSite, false, 1),
			invocation(failedSite, true, 2),
			invocation(passedSite, true, 3),
			invocation(passedSite, true, 4),
		]);
		state.runtime.values.TestRuntime.assertionSites.push(site({ siteId: 2, lineNumber: 1 }));
		expect(deriveAssertionMarkers(block, state)).toEqual([
			{ lineNumber: 2, passed: false, x: 8, y: 32, width: 16, height: 16 },
			{ lineNumber: 4, passed: true, x: 8, y: 64, width: 16, height: 16 },
		]);
	});

	it('matches physical block identity and project path, including functions', () => {
		const { block, state } = setup();
		state.runtime.values.TestRuntime = completed([
			invocation(site()),
			invocation(site({ siteId: 1, projectBlockId: 8 })),
			invocation(site({ siteId: 2, projectGroupPath: 'other' })),
			invocation(site({ siteId: 3, codeBlockType: 'function' })),
			invocation(site({ siteId: 4, projectBlockId: undefined })),
			invocation(site({ siteId: 5, source: { kind: 'include', includeId: 'test/helpers', symbolName: 'checks' } })),
		]);
		expect(deriveAssertionMarkers(block, state)).toHaveLength(1);
		block.blockType = 'function';
		expect(deriveAssertionMarkers(block, state)).toHaveLength(1);
	});

	it('uses displayed rows and widget gaps, omitting assertions hidden by collapse', () => {
		const { block, state } = setup();
		state.runtime.values.TestRuntime = completed([invocation(site()), invocation(site({ siteId: 1, lineNumber: 4 }))]);
		block.displayModel = buildDisplayModel(code, { hideAfterRawRow: 3 });
		block.gaps.set(1, { size: 3 });
		expect(deriveAssertionMarkers(block, state)).toEqual([
			{ lineNumber: 2, passed: true, x: 8, y: 80, width: 16, height: 16 },
		]);
		block.displayModel = buildDisplayModel(code, { hideAfterRawRow: 3, isExpandedForEditing: true });
		expect(deriveAssertionMarkers(block, state)).toHaveLength(2);
	});

	it('returns no markers for idle, running, or trapped tests, disabled blocks, or recompilation', () => {
		const { block, state } = setup();
		expect(deriveAssertionMarkers(block, state)).toEqual([]);
		for (const result of [
			{ status: 'idle' },
			{ status: 'running', assertionSites: [site()] },
			{ status: 'error', error: 'integer overflow', assertionSites: [site()] },
		] satisfies TestRuntimeState[]) {
			state.runtime.values.TestRuntime = result;
			expect(deriveAssertionMarkers(block, state)).toEqual([]);
		}
		state.runtime.values.TestRuntime = completed([invocation(site())]);
		block.disabled = true;
		expect(deriveAssertionMarkers(block, state)).toEqual([]);
		block.disabled = false;
		state.compiler.isCompiling = true;
		expect(deriveAssertionMarkers(block, state)).toEqual([]);
	});
});
