import type { AssertionSite } from '@8f4e/language-spec';
import { parseProjectSource } from '@8f4e/project-preparser';
import { describe, expect, it } from 'vitest';
import { createAssertionCollector, formatTestFailures, hasTestEntry } from './index';

describe('hasTestEntry', () => {
	it('recognizes test modules in nested groups', () => {
		expect(
			hasTestEntry(
				parseProjectSource(`8f4e/v1
entry test
group outer
group inner
module testModule
moduleEnd
groupEnd
groupEnd
entryEnd`)
			)
		).toBe(true);
	});

	it('recognizes a root function exported as test, including comments', () => {
		expect(
			hasTestEntry(
				parseProjectSource(`8f4e/v1
function helper
#export test ; public entry
functionEnd`)
			)
		).toBe(true);
		expect(
			hasTestEntry(
				parseProjectSource(`8f4e/v1
function test
#export
functionEnd`)
			)
		).toBe(true);
	});

	it('ignores disabled test blocks and unexported or group-local test functions', () => {
		const project = parseProjectSource(`8f4e/v1
entry test
module disabledTest
moduleEnd
entryEnd
function test
#export
functionEnd`);
		project.modules[0].disabled = true;
		project.functions[0].disabled = true;
		expect(hasTestEntry(project)).toBe(false);
		expect(
			hasTestEntry(
				parseProjectSource(`8f4e/v1
function test
functionEnd`)
			)
		).toBe(false);
		expect(
			hasTestEntry(
				parseProjectSource(`8f4e/v1
entry main
group inner
function test
#export
functionEnd
groupEnd
entryEnd`)
			)
		).toBe(false);
	});
});

describe('native assertion collection', () => {
	const sites: AssertionSite[] = [
		{
			siteId: 0,
			instruction: 'assert',
			projectGroupPath: '',
			codeBlockType: 'module',
			codeBlockId: 'checks',
			lineNumber: 2,
		},
		{
			siteId: 1,
			instruction: 'assertEqual',
			projectGroupPath: '',
			codeBlockType: 'function',
			codeBlockId: 'compare',
			lineNumber: 3,
		},
		{
			siteId: 2,
			instruction: 'assertEqual',
			projectGroupPath: 'nested',
			codeBlockType: 'function',
			codeBlockId: 'unused',
			lineNumber: 4,
		},
	];

	it('collects every invocation using integer truth and exact equality, preserving unexecuted sites', () => {
		const collector = createAssertionCollector(sites);
		collector.imports.assertCondition(0, 0);
		collector.imports.assertCondition(-1, 0);
		collector.imports.assertEqualI32(-1, -1, 1);
		collector.imports.assertEqualF32(1, 1.0001, 1);
		collector.imports.assertEqualF64(Number.NaN, Number.NaN, 1);
		collector.imports.assertEqualF64(Infinity, Infinity, 1);
		collector.imports.assertEqualF64(-0, 0, 1);
		const report = collector.getReport();
		expect(report.assertions.map(result => result.passed)).toEqual([false, true, true, false, false, true, true]);
		expect(report.assertions.map(result => result.assertIndex)).toEqual([0, 1, 2, 3, 4, 5, 6]);
		expect(report.failures).toHaveLength(3);
		expect(report.assertionSites).toBe(sites);
		expect(report.assertions.some(result => result.site.siteId === 2)).toBe(false);
		expect(formatTestFailures(report.failures)).toContain('assert #0 expected nonzero, received 0');
	});

	it('reports included-source provenance and rejects callback IDs absent from this compilation', () => {
		const includedSite: AssertionSite = {
			...sites[1],
			source: { kind: 'include', includeId: 'tests/check', symbolName: 'compare' },
		};
		const collector = createAssertionCollector([sites[0], includedSite]);
		collector.imports.assertEqualI32(3, 4, 1);
		expect(formatTestFailures(collector.getReport().failures)).toContain('include tests/check (compare)');
		expect(() => collector.imports.assertEqualI32(3, 4, 99)).toThrow('unknown site ID: 99');
	});
});
