import { describe, it, expect } from 'vitest';

import { compileConfig } from '../index';

describe('compileConfig - macro expansion', () => {
	it('should expand a simple macro', () => {
		const macros = [
			`defineMacro addVolume
rescopeTop "volume"
push 0.8
set
defineMacroEnd`,
		];

		const source = `
scope "instrument.name"
push "Piano"
set
macro addVolume
`;

		const result = compileConfig(source, { macros });
		expect(result.errors).toEqual([]);
		expect(result.config).toEqual({
			instrument: {
				name: 'Piano',
				volume: 0.8,
			},
		});
	});

	it('should expand multiple macro calls', () => {
		const macros = [
			`defineMacro addTag
push "acoustic"
defineMacroEnd`,
		];

		const source = `
scope "instrument.tags"
push "piano"
macro addTag
macro addTag
set
`;

		const result = compileConfig(source, { macros });
		expect(result.errors).toEqual([]);
		expect(result.config).toEqual({
			instrument: {
				tags: ['piano', 'acoustic', 'acoustic'],
			},
		});
	});

	it('should use multiple different macros', () => {
		const macros = [
			`defineMacro setName
rescopeTop "name"
push "Guitar"
set
defineMacroEnd`,
			`defineMacro setVolume
rescopeTop "volume"
push 0.5
set
defineMacroEnd`,
		];

		const source = `
scope "instrument.placeholder"
macro setName
macro setVolume
`;

		const result = compileConfig(source, { macros });
		expect(result.errors).toEqual([]);
		expect(result.config).toEqual({
			instrument: {
				name: 'Guitar',
				volume: 0.5,
			},
		});
	});

	it('should work without macros', () => {
		const source = `
scope "name"
push "Piano"
set
`;

		const result = compileConfig(source);
		expect(result.errors).toEqual([]);
		expect(result.config).toEqual({ name: 'Piano' });
	});

	it('should work with empty macros array', () => {
		const source = `
scope "name"
push "Piano"
set
`;

		const result = compileConfig(source, { macros: [] });
		expect(result.errors).toEqual([]);
		expect(result.config).toEqual({ name: 'Piano' });
	});

	it('should report parse error from expanded macro with macro identity', () => {
		const macros = [
			`defineMacro badMacro
push "unclosed
set
defineMacroEnd`,
		];

		const source = `
scope "test"
macro badMacro
`;

		const result = compileConfig(source, { macros });
		expect(result.config).toBeNull();
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0]).toMatchObject({
			kind: 'parse',
			line: 3, // Line 3 in source where macro is called
			macroId: 'badMacro',
		});
		expect(result.errors[0].message).toContain('Invalid string literal');
	});

	it('should report exec error from expanded macro with macro identity', () => {
		const macros = [
			`defineMacro badMacro
set
defineMacroEnd`,
		];

		const source = `
scope "test"
macro badMacro
`;

		const result = compileConfig(source, { macros });
		expect(result.config).toBeNull();
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0]).toMatchObject({
			kind: 'exec',
			line: 3, // Line 3 in source where macro is called
			macroId: 'badMacro',
		});
		expect(result.errors[0].message).toContain('Cannot set: data stack is empty');
	});

	it('should report schema error from expanded macro with macro identity', () => {
		const macros = [
			`defineMacro addWrongType
scope "count"
push "not a number"
set
defineMacroEnd`,
		];

		const source = `
scope "config"
macro addWrongType
`;

		const schema = {
			type: 'object',
			properties: {
				config: {
					type: 'object',
					properties: {
						count: { type: 'number' },
					},
				},
			},
		};

		const result = compileConfig(source, { macros, schema });
		expect(result.config).toBeNull();
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0]).toMatchObject({
			kind: 'schema',
			line: 3, // Line 3 in source where macro is called
			macroId: 'addWrongType',
			path: 'config.count',
		});
		expect(result.errors[0].message).toContain('Expected type number');
	});

	it('should error on undefined macro', () => {
		const macros = [
			`defineMacro definedMacro
push "test"
set
defineMacroEnd`,
		];

		const source = `
scope "test.value"
push "value"
set
macro undefinedMacro
`;

		const result = compileConfig(source, { macros });
		expect(result.config).toBeNull();
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0]).toMatchObject({
			kind: 'parse',
			line: 1,
		});
		expect(result.errors[0].message).toContain('Undefined macro');
	});

	it('should error on duplicate macro names', () => {
		const macros = [
			`defineMacro duplicate
push "first"
set
defineMacroEnd`,
			`defineMacro duplicate
push "second"
set
defineMacroEnd`,
		];

		const source = `
scope "test"
macro duplicate
`;

		const result = compileConfig(source, { macros });
		expect(result.config).toBeNull();
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0]).toMatchObject({
			kind: 'parse',
			line: 1,
		});
		expect(result.errors[0].message).toContain('Duplicate macro name');
	});

	it('should error on missing defineMacroEnd', () => {
		const macros = [
			`defineMacro incomplete
push "test"
set`,
		];

		const source = `
scope "test"
macro incomplete
`;

		const result = compileConfig(source, { macros });
		expect(result.config).toBeNull();
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0]).toMatchObject({
			kind: 'parse',
			line: 1,
		});
		expect(result.errors[0].message).toContain("Missing 'defineMacroEnd'");
	});

	it('should error on nested macro definitions', () => {
		const macros = [
			`defineMacro outer
defineMacro inner
push "test"
defineMacroEnd
defineMacroEnd`,
		];

		const source = `
scope "test"
macro outer
`;

		const result = compileConfig(source, { macros });
		expect(result.config).toBeNull();
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0]).toMatchObject({
			kind: 'parse',
			line: 1,
		});
		expect(result.errors[0].message).toContain('Nested macro definitions are not allowed');
	});

	it('should error on macro calls inside macro definitions', () => {
		const macros = [
			`defineMacro recursive
macro recursive
defineMacroEnd`,
		];

		const source = `
scope "test"
macro recursive
`;

		const result = compileConfig(source, { macros });
		expect(result.config).toBeNull();
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0]).toMatchObject({
			kind: 'parse',
			line: 1,
		});
		expect(result.errors[0].message).toContain('Macro calls inside macro definitions are not allowed');
	});

	it('should preserve comments in macro bodies', () => {
		const macros = [
			`defineMacro withComments
; This is a comment
push "Piano"
; Another comment
set
defineMacroEnd`,
		];

		const source = `
scope "name"
macro withComments
`;

		const result = compileConfig(source, { macros });
		expect(result.errors).toEqual([]);
		expect(result.config).toEqual({ name: 'Piano' });
	});

	it('should handle macros with const definitions', () => {
		const macros = [
			`defineMacro setDefaultVolume
scope "volume"
push 0.7
set
defineMacroEnd`,
		];

		const source = `
scope "instrument"
macro setDefaultVolume
`;

		const result = compileConfig(source, { macros });
		expect(result.errors).toEqual([]);
		expect(result.config).toEqual({
			instrument: {
				volume: 0.7,
			},
		});
	});

	it('should handle complex macro with multiple operations', () => {
		const macros = [
			`defineMacro setupInstrument
rescopeTop "name"
push "Synthesizer"
set
rescopeTop "volume"
push 0.8
set
rescopeTop "enabled"
push true
set
rescopeTop "tags"
push "electronic"
push "digital"
set
defineMacroEnd`,
		];

		const source = `
scope "instrument.placeholder"
macro setupInstrument
`;

		const result = compileConfig(source, { macros });
		expect(result.errors).toEqual([]);
		expect(result.config).toEqual({
			instrument: {
				name: 'Synthesizer',
				volume: 0.8,
				enabled: true,
				tags: ['electronic', 'digital'],
			},
		});
	});

	it('should report correct line for non-macro errors', () => {
		const macros = [
			`defineMacro goodMacro
push "valid"
set
defineMacroEnd`,
		];

		const source = `
scope "test"
macro goodMacro
invalidCommand
`;

		const result = compileConfig(source, { macros });
		expect(result.config).toBeNull();
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0]).toMatchObject({
			kind: 'parse',
			line: 4,
		});
		// This error should NOT have a macroId since it's from the main source, not a macro
		expect(result.errors[0].macroId).toBeUndefined();
	});

	it('should handle empty macro body', () => {
		const macros = [
			`defineMacro emptyMacro
defineMacroEnd`,
		];

		const source = `
scope "test"
push "value"
macro emptyMacro
set
`;

		const result = compileConfig(source, { macros });
		expect(result.errors).toEqual([]);
		expect(result.config).toEqual({ test: 'value' });
	});

	it('should handle macro with only comments', () => {
		const macros = [
			`defineMacro commentOnlyMacro
; This is a comment
; Another comment
defineMacroEnd`,
		];

		const source = `
scope "test"
push "value"
macro commentOnlyMacro
set
`;

		const result = compileConfig(source, { macros });
		expect(result.errors).toEqual([]);
		expect(result.config).toEqual({ test: 'value' });
	});
});
