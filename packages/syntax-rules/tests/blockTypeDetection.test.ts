import { describe, it, expect } from 'vitest';

import { getBlockType, getModuleId, getFunctionId } from '../src/blockTypeDetection';

describe('getBlockType', () => {
	describe('module detection', () => {
		it('detects a complete module block', () => {
			expect(getBlockType(['module test', 'int x', 'moduleEnd'])).toBe('module');
		});

		it('detects module with leading whitespace', () => {
			expect(getBlockType(['  module test', '  int x', '  moduleEnd'])).toBe('module');
		});

		it('detects module with content after keyword', () => {
			expect(getBlockType(['module test someExtraInfo', 'int x', 'moduleEnd'])).toBe('module');
		});

		it('does not detect module if moduleEnd is missing', () => {
			expect(getBlockType(['module test', 'int x'])).toBe('unknown');
		});

		it('does not detect module if module is missing', () => {
			expect(getBlockType(['int x', 'moduleEnd'])).toBe('unknown');
		});
	});

	describe('config detection', () => {
		it('detects a complete config block', () => {
			expect(getBlockType(['config', 'push 42', 'set', 'configEnd'])).toBe('config');
		});

		it('detects config with leading whitespace', () => {
			expect(getBlockType(['  config', '  push 42', '  configEnd'])).toBe('config');
		});

		it('does not detect config if configEnd is missing', () => {
			expect(getBlockType(['config', 'push 42'])).toBe('unknown');
		});

		it('does not detect config if config is missing', () => {
			expect(getBlockType(['push 42', 'configEnd'])).toBe('unknown');
		});
	});

	describe('function detection', () => {
		it('detects a complete function block', () => {
			expect(getBlockType(['function add int int', 'add', 'functionEnd int'])).toBe('function');
		});

		it('detects function with leading whitespace', () => {
			expect(getBlockType(['  function square int', '  push 2', '  mul', '  functionEnd int'])).toBe('function');
		});

		it('does not detect function if functionEnd is missing', () => {
			expect(getBlockType(['function add int int', 'add'])).toBe('unknown');
		});

		it('does not detect function if function is missing', () => {
			expect(getBlockType(['add', 'functionEnd int'])).toBe('unknown');
		});
	});

	describe('unknown states', () => {
		it('returns unknown for empty code', () => {
			expect(getBlockType([])).toBe('unknown');
		});

		it('returns unknown when no markers are present', () => {
			expect(getBlockType(['int x', 'int y'])).toBe('unknown');
		});

		it('returns unknown when module and config markers are mixed', () => {
			expect(getBlockType(['module test', 'config', 'moduleEnd', 'configEnd'])).toBe('unknown');
		});

		it('returns unknown when config block contains module markers', () => {
			expect(getBlockType(['config', 'module test', 'moduleEnd', 'configEnd'])).toBe('unknown');
		});

		it('returns unknown when module block contains config markers', () => {
			expect(getBlockType(['module test', 'config', 'configEnd', 'moduleEnd'])).toBe('unknown');
		});

		it('returns unknown when function block contains module markers', () => {
			expect(getBlockType(['function add', 'module test', 'moduleEnd', 'functionEnd'])).toBe('unknown');
		});

		it('returns unknown when module block contains function markers', () => {
			expect(getBlockType(['module test', 'function add', 'functionEnd', 'moduleEnd'])).toBe('unknown');
		});
	});

	describe('edge cases', () => {
		it('does not match module within another word', () => {
			expect(getBlockType(['somemodule test', 'moduleEnd'])).toBe('unknown');
		});

		it('does not match config within another word', () => {
			expect(getBlockType(['someconfig', 'configEnd'])).toBe('unknown');
		});

		it('does not match function within another word', () => {
			expect(getBlockType(['somefunction test', 'functionEnd'])).toBe('unknown');
		});

		it('matches module keyword at end of line', () => {
			expect(getBlockType(['module', 'moduleEnd'])).toBe('module');
		});

		it('matches config keyword at end of line', () => {
			expect(getBlockType(['config', 'configEnd'])).toBe('config');
		});

		it('matches function keyword at end of line', () => {
			expect(getBlockType(['function', 'functionEnd'])).toBe('function');
		});
	});
});

describe('getModuleId', () => {
	it('extracts the identifier argument when a module line exists', () => {
		expect(getModuleId(['module test', 'int x', 'moduleEnd'])).toBe('test');
	});

	it('returns an empty string when no module instruction is found', () => {
		expect(getModuleId(['int x', 'int y'])).toBe('');
	});

	it('extracts identifier from module with leading whitespace', () => {
		expect(getModuleId(['  module myModule', 'int x', 'moduleEnd'])).toBe('myModule');
	});

	it('returns empty string when module has no identifier', () => {
		expect(getModuleId(['module', 'int x', 'moduleEnd'])).toBe('');
	});
});

describe('getFunctionId', () => {
	it('extracts the identifier argument when a function line exists', () => {
		expect(getFunctionId(['function square int', 'push 2', 'mul', 'functionEnd int'])).toBe('square');
	});

	it('extracts identifier from function with multiple parameters', () => {
		expect(getFunctionId(['function add int int', 'add', 'functionEnd int'])).toBe('add');
	});

	it('returns an empty string when no function instruction is found', () => {
		expect(getFunctionId(['int x', 'int y'])).toBe('');
	});

	it('handles function with no parameters', () => {
		expect(getFunctionId(['function getFortyTwo', 'push 42', 'functionEnd int'])).toBe('getFortyTwo');
	});

	it('extracts identifier from function with leading whitespace', () => {
		expect(getFunctionId(['  function myFunc int', 'push 1', 'functionEnd int'])).toBe('myFunc');
	});

	it('returns empty string when function has no identifier', () => {
		expect(getFunctionId(['function', 'push 42', 'functionEnd int'])).toBe('');
	});
});
