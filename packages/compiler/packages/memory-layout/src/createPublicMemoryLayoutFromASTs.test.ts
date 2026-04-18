import { compileToAST } from '@8f4e/tokenizer';
import { describe, expect, it } from 'vitest';

import { createPublicMemoryLayoutFromASTs } from './createPublicMemoryLayoutFromASTs';

describe('createPublicMemoryLayoutFromASTs', () => {
	it('creates public module memory layout from ASTs', () => {
		const asts = [
			compileToAST(['module first', 'int input', 'float64 wide', 'moduleEnd']),
			compileToAST(['module second', 'int output &first:input', 'moduleEnd']),
		];

		const layout = createPublicMemoryLayoutFromASTs(asts);

		expect(layout.modules.first.byteAddress).toBe(4);
		expect(layout.modules.first.memoryMap.input.byteAddress).toBe(4);
		expect(layout.modules.first.memoryMap.wide.byteAddress % 8).toBe(0);
		expect(layout.modules.second.byteAddress).toBe(16);
		expect(layout.modules.second.memoryMap.output.default).toBe(4);
	});

	it('does not expose codegen-only hidden allocations as public memory', () => {
		const asts = [
			compileToAST([
				'module detector',
				'int input',
				'loop',
				'push input',
				'hasChanged',
				'drop',
				'loopEnd',
				'moduleEnd',
			]),
		];

		const layout = createPublicMemoryLayoutFromASTs(asts);

		expect(Object.keys(layout.modules.detector.memoryMap)).toEqual(['input']);
		expect(Object.keys(layout.modules.detector.memoryMap).some(id => id.includes('__hasChangedDetector'))).toBe(false);
	});
});
