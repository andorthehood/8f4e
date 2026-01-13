import { describe, it, expect } from 'vitest';

import { compileConfig } from '../index';

describe('compileConfig - const command', () => {
	it('should define and use constants', () => {
		const source = `
const BASE_PATH "/var/lib"
const MAX_COUNT 100

scope "config.path"
push BASE_PATH
set

rescope "config.count"
push MAX_COUNT
set
`;
		const result = compileConfig(source);
		expect(result.errors).toEqual([]);
		expect(result.config).toEqual({
			config: {
				path: '/var/lib',
				count: 100,
			},
		});
	});

	it('should handle scoped constants', () => {
		const source = `
const GLOBAL "global value"

scope "first"
const LOCAL "first local"
push LOCAL
set

rescope "second"
const LOCAL "second local"
push LOCAL
set

rescope "global"
push GLOBAL
set
`;
		const result = compileConfig(source);
		expect(result.errors).toEqual([]);
		expect(result.config).toEqual({
			first: 'first local',
			second: 'second local',
			global: 'global value',
		});
	});

	it('should shadow outer scope constants', () => {
		const source = `
const NAME "outer"

scope "outer.value"
push NAME
set

rescopeTop "inner"
const NAME "inner"
scope "value"
push NAME
set

popScope
rescopeTop "after.value"
push NAME
set
`;
		const result = compileConfig(source);
		expect(result.errors).toEqual([]);
		expect(result.config).toEqual({
			outer: {
				value: 'outer',
				inner: {
					value: 'inner',
				},
				after: {
					value: 'outer',
				},
			},
		});
	});

	it('should error on unknown constant', () => {
		const source = `
scope "test"
push UNKNOWN
set
`;
		const result = compileConfig(source);
		expect(result.config).toBeNull();
		expect(result.errors).toMatchSnapshot();
	});

	it('should error on same-scope redefinition', () => {
		const source = `
const NAME "first"
const NAME "second"
`;
		const result = compileConfig(source);
		expect(result.config).toBeNull();
		expect(result.errors).toMatchSnapshot();
	});

	it('should allow constants with different types', () => {
		const source = `
const STR_VAL "text"
const NUM_VAL 42
const BOOL_VAL true
const NULL_VAL null

scope "test.str"
push STR_VAL
set

rescopeTop "num"
push NUM_VAL
set

rescopeTop "bool"
push BOOL_VAL
set

rescopeTop "null"
push NULL_VAL
set
`;
		const result = compileConfig(source);
		expect(result.errors).toEqual([]);
		expect(result.config).toEqual({
			test: {
				str: 'text',
				num: 42,
				bool: true,
				null: null,
			},
		});
	});

	it('should clean up constants when popping scope', () => {
		const source = `
scope "level1"
const VAL1 "first"
scope "value"
push VAL1
set

rescopeTop "level2.value"
const VAL2 "second"
push VAL2
set

popScope
rescopeTop "after"
; VAL2 should be cleaned up, but VAL1 should still exist
push VAL1
set
`;
		const result = compileConfig(source);
		expect(result.errors).toEqual([]);
		expect(result.config).toEqual({
			level1: {
				value: 'first',
				level2: {
					value: 'second',
				},
				after: 'first',
			},
		});
	});

	it('should concat string literal with constant', () => {
		const source = `
const BASE_URL "https://example.com"

scope "urls.api"
push BASE_URL
push "/api/v1"
concat
set

rescope "urls.docs"
push BASE_URL
push "/docs"
concat
set
`;
		const result = compileConfig(source);
		expect(result.errors).toEqual([]);
		expect(result.config).toEqual({
			urls: {
				api: 'https://example.com/api/v1',
				docs: 'https://example.com/docs',
			},
		});
	});
});
