import { describe, it, expect } from 'vitest';

import { getBlockType, getModuleId, getLongestLineLength, getLastMemoryInstructionLine } from './codeParsers';

describe('codeParsers', () => {
	describe('getBlockType', () => {
		describe('module detection', () => {
			it('should detect a complete module block', () => {
				const code = ['module test', 'int x', 'moduleEnd'];
				expect(getBlockType(code)).toBe('module');
			});

			it('should detect module with leading whitespace', () => {
				const code = ['  module test', '  int x', '  moduleEnd'];
				expect(getBlockType(code)).toBe('module');
			});

			it('should detect module with trailing content after keyword', () => {
				const code = ['module test someExtraInfo', 'int x', 'moduleEnd'];
				expect(getBlockType(code)).toBe('module');
			});

			it('should not detect module if only module is present (no moduleEnd)', () => {
				const code = ['module test', 'int x'];
				expect(getBlockType(code)).toBe('unknown');
			});

			it('should not detect module if only moduleEnd is present (no module)', () => {
				const code = ['int x', 'moduleEnd'];
				expect(getBlockType(code)).toBe('unknown');
			});
		});

		describe('config detection', () => {
			it('should detect a complete config block', () => {
				const code = ['config', 'push 42', 'set', 'configEnd'];
				expect(getBlockType(code)).toBe('config');
			});

			it('should detect config with leading whitespace', () => {
				const code = ['  config', '  push 42', '  configEnd'];
				expect(getBlockType(code)).toBe('config');
			});

			it('should not detect config if only config is present (no configEnd)', () => {
				const code = ['config', 'push 42'];
				expect(getBlockType(code)).toBe('unknown');
			});

			it('should not detect config if only configEnd is present (no config)', () => {
				const code = ['push 42', 'configEnd'];
				expect(getBlockType(code)).toBe('unknown');
			});
		});

		describe('unknown detection', () => {
			it('should return unknown for empty code', () => {
				const code: string[] = [];
				expect(getBlockType(code)).toBe('unknown');
			});

			it('should return unknown for code without markers', () => {
				const code = ['int x', 'int y'];
				expect(getBlockType(code)).toBe('unknown');
			});

			it('should return unknown for mixed module and config markers', () => {
				const code = ['module test', 'config', 'moduleEnd', 'configEnd'];
				expect(getBlockType(code)).toBe('unknown');
			});

			it('should return unknown for config block with module markers', () => {
				const code = ['config', 'module test', 'moduleEnd', 'configEnd'];
				expect(getBlockType(code)).toBe('unknown');
			});

			it('should return unknown for module block with config markers', () => {
				const code = ['module test', 'config', 'configEnd', 'moduleEnd'];
				expect(getBlockType(code)).toBe('unknown');
			});
		});

		describe('edge cases', () => {
			it('should not match module inside a word', () => {
				const code = ['somemodule test', 'moduleEnd'];
				expect(getBlockType(code)).toBe('unknown');
			});

			it('should not match config inside a word', () => {
				const code = ['someconfig', 'configEnd'];
				expect(getBlockType(code)).toBe('unknown');
			});

			it('should match module at end of line (with no space after)', () => {
				const code = ['module', 'moduleEnd'];
				expect(getBlockType(code)).toBe('module');
			});

			it('should match config at end of line (with no space after)', () => {
				const code = ['config', 'configEnd'];
				expect(getBlockType(code)).toBe('config');
			});
		});
	});

	describe('getModuleId', () => {
		it('should extract module id from code', () => {
			const code = ['module test', 'int x', 'moduleEnd'];
			expect(getModuleId(code)).toBe('test');
		});

		it('should return empty string if no module found', () => {
			const code = ['int x', 'int y'];
			expect(getModuleId(code)).toBe('');
		});
	});

	describe('getLongestLineLength', () => {
		it('should return the length of the longest line', () => {
			const code = ['short', 'much longer line', 'medium'];
			expect(getLongestLineLength(code)).toBe(16);
		});

		it('should return 0 for empty array', () => {
			const code: string[] = [];
			expect(getLongestLineLength(code)).toBe(0);
		});
	});

	describe('getLastMemoryInstructionLine', () => {
		it('should return the last line index with memory instruction', () => {
			const code = ['memory 1', 'other', 'memory 2', 'end'];
			expect(getLastMemoryInstructionLine(code)).toBe(2);
		});

		it('should return -1 if no memory instruction found', () => {
			const code = ['int x', 'int y'];
			expect(getLastMemoryInstructionLine(code)).toBe(-1);
		});
	});
});
