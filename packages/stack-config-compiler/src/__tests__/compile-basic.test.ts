import { describe, it, expect } from 'vitest';

import { compileConfig } from '../index';

describe('compileConfig - basic compilation', () => {
	it('should compile a comprehensive example covering all features', () => {
		const source = `
; ============================================
; Comprehensive stack-config-compiler example
; ============================================

; Basic string value
scope "instrument.name"
push "Piano"
set

; Number value with rescopeTop
rescopeTop "volume"
push 0.8
set

; Array value (multiple pushes create array)
rescopeTop "tags"
push "keyboard"
push "acoustic"
set

; Boolean values
rescopeTop "enabled"
push true
set

rescopeTop "muted"
push false
set

; Null value
rescopeTop "parent"
push null
set

; Inline comments are supported
rescopeTop "notes" ; switching to notes field
push "C4" ; middle C
push "E4" ; major third
push "G4" ; perfect fifth
set ; creates a chord array

; rescope replaces entire scope
rescope "icons.piano"
scope "color"
push "blue"
set

; popScope pops scope level
popScope
scope "size"
push 48
set

; Nested objects via dot notation
rescope "settings.audio.gain"
push 0.75
set

; Array indices
rescope "channels[0]"
push "left"
set

rescope "channels[1]"
push "right"
set

; append command
rescope "effects"
push "reverb"
push "delay"
set
push "chorus"
append

; String escaping
rescope "message"
push "He said \\"hello\\""
set

rescope "path"
push "C:\\\\Users\\\\test"
set

rescope "formatted"
push "line1\\nline2\\ttabbed"
set

; Semicolon inside string (should not be treated as comment)
rescope "semicolonTest"
push "text ; with semicolon"
set

; Mixed object and array paths
rescope "matrix[0][0]"
push 1
set

rescope "matrix[0][1]"
push 2
set

rescope "data.items[0].name"
push "first"
set

; rescopeSuffix replaces trailing suffix
rescope "icons.piano.title"
push "Piano Icon"
set

rescopeSuffix "harp.title"
push "Harp Icon"
set

; rescopeSuffix with array indices
rescope "settings.runtime[0].config"
push "dev"
set

rescopeSuffix "runtime[1].config"
push "prod"
set
`;

		const result = compileConfig([source]);
		expect(result.errors).toEqual([]);
		expect(result.config).toMatchSnapshot();
	});

	it('should return errors for invalid input', () => {
		const source = `
scope "test"
unknownCommand
push "value"
set
`;
		const result = compileConfig([source]);
		expect(result.config).toBeNull();
		expect(result.errors).toMatchSnapshot();
	});

	it('should return error for type conflict', () => {
		const source = `
scope "name"
push "Piano"
set

scope "name.nested"
push "value"
set
`;
		const result = compileConfig([source]);
		expect(result.config).toBeNull();
		expect(result.errors).toMatchSnapshot();
	});

	it('should return error for unclosed string literal', () => {
		const source = `
scope "name"
push "unclosed
set
`;
		const result = compileConfig([source]);
		expect(result.config).toBeNull();
		expect(result.errors).toMatchSnapshot();
	});

	it('should return error for malformed path', () => {
		const source = `
scope "items[0"
push "value"
set
`;
		const result = compileConfig([source]);
		expect(result.config).toBeNull();
		expect(result.errors).toMatchSnapshot();
	});

	it('should return error for operations on empty stacks', () => {
		const source = `
set
`;
		const result = compileConfig([source]);
		expect(result.config).toBeNull();
		expect(result.errors).toMatchSnapshot();
	});

	it('should return error for append to non-array', () => {
		const source = `
scope "name"
push "string"
set
push "extra"
append
`;
		const result = compileConfig([source]);
		expect(result.config).toBeNull();
		expect(result.errors).toMatchSnapshot();
	});

	it('should support set shorthand with literal argument', () => {
		const source = `
scope "instrument.name"
set "Piano"

rescopeTop "volume"
set 0.8
`;
		const result = compileConfig([source]);
		expect(result.errors).toEqual([]);
		expect(result.config).toEqual({
			instrument: {
				name: 'Piano',
				volume: 0.8,
			},
		});
	});
});
