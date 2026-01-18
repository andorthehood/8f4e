import { describe, it, expect } from 'vitest';

import { collectMacros } from './collectMacros';
import { expandMacros } from './expandMacros';

import { createMockCodeBlock } from '../../pureHelpers/testingUtils/testUtils';

describe('Macro expansion integration', () => {
	it('should expand macros in module blocks', () => {
		const macroBlock = createMockCodeBlock({
			code: ['defmacro init', 'push 0', 'set x', 'defmacroEnd'],
			blockType: 'macro',
			creationIndex: 0,
		});
		const moduleBlock = createMockCodeBlock({
			code: ['module test', 'macro init', 'push 1', 'moduleEnd'],
			blockType: 'module',
			creationIndex: 1,
		});

		const { macros } = collectMacros([macroBlock, moduleBlock]);
		const { expandedCode, errors } = expandMacros(moduleBlock.code, macros, moduleBlock.id);

		expect(errors).toHaveLength(0);
		expect(expandedCode).toEqual(['module test', 'push 0', 'set x', 'push 1', 'moduleEnd']);
	});

	it('should expand macros in config blocks', () => {
		const macroBlock = createMockCodeBlock({
			code: ['defmacro setup', 'set sampleRate 48000', 'defmacroEnd'],
			blockType: 'macro',
			creationIndex: 0,
		});
		const configBlock = createMockCodeBlock({
			code: ['config', 'macro setup', 'set selectedRuntime 0', 'configEnd'],
			blockType: 'config',
			creationIndex: 1,
		});

		const { macros } = collectMacros([macroBlock, configBlock]);
		const { expandedCode, errors } = expandMacros(configBlock.code, macros, configBlock.id);

		expect(errors).toHaveLength(0);
		expect(expandedCode).toEqual(['config', 'set sampleRate 48000', 'set selectedRuntime 0', 'configEnd']);
	});

	it('should report error for undefined macro', () => {
		const moduleBlock = createMockCodeBlock({
			code: ['module test', 'macro undefinedMacro', 'moduleEnd'],
			blockType: 'module',
			creationIndex: 0,
		});

		const { macros } = collectMacros([moduleBlock]);
		const { errors } = expandMacros(moduleBlock.code, macros, moduleBlock.id);

		expect(errors).toHaveLength(1);
		expect(errors[0].message).toContain('Undefined macro');
		expect(errors[0].lineNumber).toBe(2);
	});

	it('should report error for duplicate macro definitions', () => {
		const macro1 = createMockCodeBlock({
			code: ['defmacro duplicate', 'push 1', 'defmacroEnd'],
			blockType: 'macro',
			creationIndex: 0,
		});
		const macro2 = createMockCodeBlock({
			code: ['defmacro duplicate', 'push 2', 'defmacroEnd'],
			blockType: 'macro',
			creationIndex: 1,
		});

		const { macros, errors } = collectMacros([macro1, macro2]);

		expect(errors).toHaveLength(1);
		expect(errors[0].message).toContain('Duplicate macro definition');
		expect(macros.size).toBe(1);
	});

	it('should handle multiple macros in a single block', () => {
		const macro1 = createMockCodeBlock({
			code: ['defmacro init', 'push 0', 'defmacroEnd'],
			blockType: 'macro',
			creationIndex: 0,
		});
		const macro2 = createMockCodeBlock({
			code: ['defmacro cleanup', 'pop', 'defmacroEnd'],
			blockType: 'macro',
			creationIndex: 1,
		});
		const moduleBlock = createMockCodeBlock({
			code: ['module test', 'macro init', 'push 1', 'macro cleanup', 'moduleEnd'],
			blockType: 'module',
			creationIndex: 2,
		});

		const { macros } = collectMacros([macro1, macro2, moduleBlock]);
		const { expandedCode, errors } = expandMacros(moduleBlock.code, macros, moduleBlock.id);

		expect(errors).toHaveLength(0);
		expect(expandedCode).toEqual(['module test', 'push 0', 'push 1', 'pop', 'moduleEnd']);
	});

	it('should build correct line mappings for error attribution', () => {
		const macroBlock = createMockCodeBlock({
			code: ['defmacro multi', 'line 1', 'line 2', 'line 3', 'defmacroEnd'],
			blockType: 'macro',
			creationIndex: 0,
		});
		const moduleBlock = createMockCodeBlock({
			code: ['module test', 'before', 'macro multi', 'after', 'moduleEnd'],
			blockType: 'module',
			creationIndex: 1,
		});

		const { macros } = collectMacros([macroBlock, moduleBlock]);
		const { lineMappings } = expandMacros(moduleBlock.code, macros, moduleBlock.id);

		expect(lineMappings).toHaveLength(7);
		expect(lineMappings[0]).toEqual({ expandedLineNumber: 1, originalLineNumber: 1, originalBlockId: moduleBlock.id });
		expect(lineMappings[1]).toEqual({ expandedLineNumber: 2, originalLineNumber: 2, originalBlockId: moduleBlock.id });
		expect(lineMappings[2]).toEqual({ expandedLineNumber: 3, originalLineNumber: 3, originalBlockId: moduleBlock.id });
		expect(lineMappings[3]).toEqual({ expandedLineNumber: 4, originalLineNumber: 3, originalBlockId: moduleBlock.id });
		expect(lineMappings[4]).toEqual({ expandedLineNumber: 5, originalLineNumber: 3, originalBlockId: moduleBlock.id });
		expect(lineMappings[5]).toEqual({ expandedLineNumber: 6, originalLineNumber: 4, originalBlockId: moduleBlock.id });
		expect(lineMappings[6]).toEqual({ expandedLineNumber: 7, originalLineNumber: 5, originalBlockId: moduleBlock.id });
	});

	it('should handle empty macro bodies', () => {
		const macroBlock = createMockCodeBlock({
			code: ['defmacro empty', 'defmacroEnd'],
			blockType: 'macro',
			creationIndex: 0,
		});
		const moduleBlock = createMockCodeBlock({
			code: ['module test', 'before', 'macro empty', 'after', 'moduleEnd'],
			blockType: 'module',
			creationIndex: 1,
		});

		const { macros } = collectMacros([macroBlock, moduleBlock]);
		const { expandedCode, errors } = expandMacros(moduleBlock.code, macros, moduleBlock.id);

		expect(errors).toHaveLength(0);
		expect(expandedCode).toEqual(['module test', 'before', 'after', 'moduleEnd']);
	});
});
