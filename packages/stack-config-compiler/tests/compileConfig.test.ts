import { describe, test, expect } from 'vitest';

import { compileConfig } from '../src/index';

describe('compileConfig', () => {
	describe('basic functionality', () => {
		test('should return empty object for empty source', () => {
			const result = compileConfig('');
			expect(result.config).toEqual({});
			expect(result.errors).toEqual([]);
		});

		test('should ignore comments', () => {
			const result = compileConfig(`
; This is a comment
; Another comment
`);
			expect(result.config).toEqual({});
			expect(result.errors).toEqual([]);
		});

		test('should ignore empty lines', () => {
			const result = compileConfig(`

scope "name"

push "test"

set

`);
			expect(result.config).toEqual({ name: 'test' });
			expect(result.errors).toEqual([]);
		});
	});

	describe('push command', () => {
		test('should push string literal', () => {
			const result = compileConfig(`
scope "name"
push "hello"
set
`);
			expect(result.config).toEqual({ name: 'hello' });
			expect(result.errors).toEqual([]);
		});

		test('should push number literal', () => {
			const result = compileConfig(`
scope "volume"
push 0.8
set
`);
			expect(result.config).toEqual({ volume: 0.8 });
			expect(result.errors).toEqual([]);
		});

		test('should push integer literal', () => {
			const result = compileConfig(`
scope "count"
push 123
set
`);
			expect(result.config).toEqual({ count: 123 });
			expect(result.errors).toEqual([]);
		});

		test('should push boolean true', () => {
			const result = compileConfig(`
scope "enabled"
push true
set
`);
			expect(result.config).toEqual({ enabled: true });
			expect(result.errors).toEqual([]);
		});

		test('should push boolean false', () => {
			const result = compileConfig(`
scope "disabled"
push false
set
`);
			expect(result.config).toEqual({ disabled: false });
			expect(result.errors).toEqual([]);
		});

		test('should push null', () => {
			const result = compileConfig(`
scope "nothing"
push null
set
`);
			expect(result.config).toEqual({ nothing: null });
			expect(result.errors).toEqual([]);
		});

		test('should error on push without argument', () => {
			const result = compileConfig(`
scope "name"
push
set
`);
			expect(result.config).toBeNull();
			expect(result.errors.length).toBe(1);
			expect(result.errors[0].message).toContain('requires a literal argument');
		});

		test('should error on invalid literal', () => {
			const result = compileConfig(`
scope "name"
push invalidLiteral
set
`);
			expect(result.config).toBeNull();
			expect(result.errors.length).toBe(1);
			expect(result.errors[0].message).toContain('Invalid literal');
		});
	});

	describe('set command', () => {
		test('should set single value', () => {
			const result = compileConfig(`
scope "name"
push "Piano"
set
`);
			expect(result.config).toEqual({ name: 'Piano' });
			expect(result.errors).toEqual([]);
		});

		test('should set multiple values as array', () => {
			const result = compileConfig(`
scope "channels"
push "left"
push "right"
set
`);
			expect(result.config).toEqual({ channels: ['left', 'right'] });
			expect(result.errors).toEqual([]);
		});

		test('should error when setting at root scope', () => {
			const result = compileConfig(`
push "value"
set
`);
			expect(result.config).toBeNull();
			expect(result.errors.length).toBe(1);
			expect(result.errors[0].message).toContain('root scope');
		});

		test('should error when data stack is empty', () => {
			const result = compileConfig(`
scope "name"
set
`);
			expect(result.config).toBeNull();
			expect(result.errors.length).toBe(1);
			expect(result.errors[0].message).toContain('data stack is empty');
		});
	});

	describe('append command', () => {
		test('should append to new array', () => {
			const result = compileConfig(`
scope "items"
push "first"
append
`);
			expect(result.config).toEqual({ items: ['first'] });
			expect(result.errors).toEqual([]);
		});

		test('should append to existing array', () => {
			const result = compileConfig(`
scope "channels"
push "left"
push "right"
set

push "center"
push "sub"
append
`);
			expect(result.config).toEqual({ channels: ['left', 'right', 'center', 'sub'] });
			expect(result.errors).toEqual([]);
		});

		test('should error when appending to non-array', () => {
			const result = compileConfig(`
scope "name"
push "Piano"
set

push "extra"
append
`);
			expect(result.config).toBeNull();
			expect(result.errors.length).toBe(1);
			expect(result.errors[0].message).toContain('non-array');
		});

		test('should error when appending at root scope', () => {
			const result = compileConfig(`
push "value"
append
`);
			expect(result.config).toBeNull();
			expect(result.errors.length).toBe(1);
			expect(result.errors[0].message).toContain('root scope');
		});
	});

	describe('scope command', () => {
		test('should create simple scope', () => {
			const result = compileConfig(`
scope "name"
push "Piano"
set
`);
			expect(result.config).toEqual({ name: 'Piano' });
			expect(result.errors).toEqual([]);
		});

		test('should create nested scope with dot notation', () => {
			const result = compileConfig(`
scope "icons.piano.color"
push "blue"
set
`);
			expect(result.config).toEqual({
				icons: {
					piano: {
						color: 'blue',
					},
				},
			});
			expect(result.errors).toEqual([]);
		});

		test('should accumulate scopes', () => {
			const result = compileConfig(`
scope "icons"
scope "piano"
push "blue"
set
`);
			expect(result.config).toEqual({
				icons: {
					piano: 'blue',
				},
			});
			expect(result.errors).toEqual([]);
		});

		test('should error on scope without argument', () => {
			const result = compileConfig(`
scope
push "value"
set
`);
			expect(result.config).toBeNull();
			expect(result.errors.length).toBe(1);
			expect(result.errors[0].message).toContain('requires a path argument');
		});
	});

	describe('rescopeTop command', () => {
		test('should replace top scope segment', () => {
			const result = compileConfig(`
scope "icons.piano"
rescopeTop "harp"
push "gold"
set
`);
			expect(result.config).toEqual({
				icons: {
					harp: 'gold',
				},
			});
			expect(result.errors).toEqual([]);
		});

		test('should replace with multi-segment path', () => {
			const result = compileConfig(`
scope "icons.piano"
rescopeTop "harp.keys"
push 88
set
`);
			expect(result.config).toEqual({
				icons: {
					harp: {
						keys: 88,
					},
				},
			});
			expect(result.errors).toEqual([]);
		});

		test('should error when scope stack is empty', () => {
			const result = compileConfig(`
rescopeTop "something"
`);
			expect(result.config).toBeNull();
			expect(result.errors.length).toBe(1);
			expect(result.errors[0].message).toContain('scope stack is empty');
		});
	});

	describe('rescope command', () => {
		test('should replace entire scope', () => {
			const result = compileConfig(`
scope "icons.piano"
rescope "drums.color"
push "red"
set
`);
			expect(result.config).toEqual({
				drums: {
					color: 'red',
				},
			});
			expect(result.errors).toEqual([]);
		});

		test('should work when no current scope', () => {
			const result = compileConfig(`
rescope "instrument.name"
push "Guitar"
set
`);
			expect(result.config).toEqual({
				instrument: {
					name: 'Guitar',
				},
			});
			expect(result.errors).toEqual([]);
		});
	});

	describe('endScope command', () => {
		test('should pop single scope level', () => {
			const result = compileConfig(`
scope "icons"
scope "piano"
push "blue"
set
endScope
scope "drums"
push "red"
set
`);
			expect(result.config).toEqual({
				icons: {
					piano: 'blue',
					drums: 'red',
				},
			});
			expect(result.errors).toEqual([]);
		});

		test('should error when scope stack is empty', () => {
			const result = compileConfig(`
endScope
`);
			expect(result.config).toBeNull();
			expect(result.errors.length).toBe(1);
			expect(result.errors[0].message).toContain('scope stack is empty');
		});
	});

	describe('array index paths', () => {
		test('should support array indices in scope', () => {
			const result = compileConfig(`
scope "items[0]"
push "first"
set
`);
			expect(result.config).toEqual({
				items: ['first'],
			});
			expect(result.errors).toEqual([]);
		});

		test('should support nested array indices', () => {
			const result = compileConfig(`
scope "matrix[0][1]"
push 42
set
`);
			expect(result.config).toEqual({
				matrix: [[undefined, 42]],
			});
			expect(result.errors).toEqual([]);
		});

		test('should support mixed object and array paths', () => {
			const result = compileConfig(`
scope "data.items[2].name"
push "third"
set
`);
			expect(result.config).toEqual({
				data: {
					items: [undefined, undefined, { name: 'third' }],
				},
			});
			expect(result.errors).toEqual([]);
		});
	});

	describe('spec examples', () => {
		test('simple object field example from spec', () => {
			const result = compileConfig(`
scope "name"
push "Piano"
set
`);
			expect(result.config).toEqual({ name: 'Piano' });
			expect(result.errors).toEqual([]);
		});

		test('nested via scope example from spec', () => {
			const result = compileConfig(`
scope "icons.piano.color"
push "blue"
set
`);
			expect(result.config).toEqual({
				icons: {
					piano: {
						color: 'blue',
					},
				},
			});
			expect(result.errors).toEqual([]);
		});

		test('append example from spec', () => {
			const result = compileConfig(`
scope "channels"
push "left"
push "right"
set

push "center"
push "sub"
append
`);
			expect(result.config).toEqual({
				channels: ['left', 'right', 'center', 'sub'],
			});
			expect(result.errors).toEqual([]);
		});

		test('endScope example from spec', () => {
			const result = compileConfig(`
scope "icons"

  scope "piano.color"
  push "blue"
  set
  endScope
  endScope

  scope "drums.color"
  push "red"
  set
  endScope
  endScope

endScope
`);
			expect(result.config).toEqual({
				icons: {
					piano: {
						color: 'blue',
					},
					drums: {
						color: 'red',
					},
				},
			});
			expect(result.errors).toEqual([]);
		});

		test('end-to-end program from spec', () => {
			const result = compileConfig(`
scope "instrument.name"
push "Piano"
set

rescopeTop "volume"
push 0.8
set

rescopeTop "tags"
push "keyboard"
push "acoustic"
set
`);
			expect(result.config).toEqual({
				instrument: {
					name: 'Piano',
					volume: 0.8,
					tags: ['keyboard', 'acoustic'],
				},
			});
			expect(result.errors).toEqual([]);
		});
	});

	describe('error conditions', () => {
		test('should return error with line number for unknown command', () => {
			const result = compileConfig(`
scope "test"
unknownCommand
push "value"
set
`);
			expect(result.config).toBeNull();
			expect(result.errors.length).toBe(1);
			expect(result.errors[0].line).toBe(3);
			expect(result.errors[0].message).toContain('Unknown command');
		});

		test('should return error for type conflict (writing through scalar)', () => {
			const result = compileConfig(`
scope "name"
push "Piano"
set

scope "name.nested"
push "value"
set
`);
			expect(result.config).toBeNull();
			expect(result.errors.length).toBe(1);
			expect(result.errors[0].message).toContain('Type conflict');
		});

		test('should handle unclosed string literal', () => {
			const result = compileConfig(`
scope "name"
push "unclosed
set
`);
			expect(result.config).toBeNull();
			expect(result.errors.length).toBe(1);
			expect(result.errors[0].message).toContain('Invalid string literal');
		});

		test('should return error for malformed path (unclosed bracket)', () => {
			const result = compileConfig(`
scope "items[0"
push "value"
set
`);
			expect(result.config).toBeNull();
			expect(result.errors.length).toBeGreaterThanOrEqual(1);
			expect(result.errors[0].message).toContain('unclosed bracket');
		});
	});

	describe('string escaping', () => {
		test('should handle escaped quotes in strings', () => {
			const result = compileConfig(`
scope "quote"
push "He said \\"hello\\""
set
`);
			expect(result.config).toEqual({ quote: 'He said "hello"' });
			expect(result.errors).toEqual([]);
		});

		test('should handle escaped backslashes', () => {
			const result = compileConfig(`
scope "path"
push "C:\\\\Users\\\\test"
set
`);
			expect(result.config).toEqual({ path: 'C:\\Users\\test' });
			expect(result.errors).toEqual([]);
		});

		test('should handle newlines and tabs', () => {
			const result = compileConfig(`
scope "text"
push "line1\\nline2\\ttabbed"
set
`);
			expect(result.config).toEqual({ text: 'line1\nline2\ttabbed' });
			expect(result.errors).toEqual([]);
		});
	});

	describe('case sensitivity', () => {
		test('should handle case-insensitive commands', () => {
			const result = compileConfig(`
SCOPE "name"
PUSH "value"
SET
`);
			expect(result.config).toEqual({ name: 'value' });
			expect(result.errors).toEqual([]);
		});

		test('should handle mixed case commands', () => {
			const result = compileConfig(`
Scope "name"
Push "value"
Set
`);
			expect(result.config).toEqual({ name: 'value' });
			expect(result.errors).toEqual([]);
		});
	});
});
