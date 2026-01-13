import { describe, it, expect } from 'vitest';

import { compileConfig } from '../index';

describe('compileConfig - concat command', () => {
	it('should compile concat with two strings', () => {
		const source = `
scope "message"
push "foo"
push "bar"
concat
set
`;
		const result = compileConfig(source);
		expect(result.errors).toEqual([]);
		expect(result.config).toEqual({ message: 'foobar' });
	});

	it('should compile concat with three or more values', () => {
		const source = `
scope "combined"
push "foo"
push "bar"
push 123
concat
set
`;
		const result = compileConfig(source);
		expect(result.errors).toEqual([]);
		expect(result.config).toEqual({ combined: 'foobar123' });
	});

	it('should coerce non-string values with concat', () => {
		const source = `
scope "coerced"
push "value:"
push true
push null
push 42
concat
set
`;
		const result = compileConfig(source);
		expect(result.errors).toEqual([]);
		expect(result.config).toEqual({ coerced: 'value:truenull42' });
	});

	it('should return error for concat on empty stack', () => {
		const source = `
scope "test"
concat
set
`;
		const result = compileConfig(source);
		expect(result.config).toBeNull();
		expect(result.errors).toMatchSnapshot();
	});

	it('should handle single value concat', () => {
		const source = `
scope "single"
push "only"
concat
set
`;
		const result = compileConfig(source);
		expect(result.errors).toEqual([]);
		expect(result.config).toEqual({ single: 'only' });
	});
});
