import { compileToAST } from '@8f4e/tokenizer';
import { describe, expect, it } from 'vitest';

import sortModules from './graphOptimizer';

import type { ConstantsAST, ModuleAST } from '@8f4e/compiler-spec';

function compileModuleAst(code: string[]): ModuleAST | ConstantsAST {
	const ast = compileToAST(code);
	if (ast.type === 'function') {
		throw new Error('Expected a module or constants AST.');
	}
	return ast;
}

const createModuleAst = (moduleId: string, references: string[] = []): ModuleAST | ConstantsAST =>
	compileModuleAst([
		`module ${moduleId}`,
		...references.map((reference, index) => `int value${index} ${reference}`),
		'moduleEnd',
	]);

const createConstantsAst = (): ModuleAST | ConstantsAST => compileModuleAst(['constants shared', 'constantsEnd']);

const getModuleId = (ast: ModuleAST | ConstantsAST): string => ast.id;

describe('sortModules', () => {
	it('puts constants blocks first and sorts independent modules by module id', () => {
		const constants = createConstantsAst();
		const beta = createModuleAst('beta');
		const alpha = createModuleAst('alpha');

		const sorted = sortModules([beta, constants, alpha]);

		expect(sorted.map(getModuleId)).toEqual(['shared', 'alpha', 'beta']);
	});

	it('handles all supported intermodular reference syntaxes', () => {
		const alpha = createModuleAst('alpha');
		const beta = createModuleAst('beta', [
			'count(alpha:value)',
			'sizeof(alpha:value)',
			'max(alpha:value)',
			'min(alpha:value)',
			'&alpha:value',
			'alpha:value&',
			'&alpha:',
			'alpha:&',
		]);

		const sorted = sortModules([beta, alpha]);

		expect(sorted.map(getModuleId)).toEqual(['alpha', 'beta']);
	});

	it('orders referenced module before the module that references it', () => {
		const alpha = createModuleAst('alpha', ['&beta:value']);
		const beta = createModuleAst('beta');

		const sorted = sortModules([alpha, beta]);

		expect(sorted.map(getModuleId)).toEqual(['beta', 'alpha']);
	});

	it('orders referenced module before the module that references it inside a compile-time expression', () => {
		const alpha = compileModuleAst(['module alpha', 'int size 2*sizeof(beta:value)', 'moduleEnd']);
		const beta = createModuleAst('beta');

		const sorted = sortModules([alpha, beta]);

		expect(sorted.map(getModuleId)).toEqual(['beta', 'alpha']);
	});

	it('ignores non-memory-declaration instructions when detecting dependencies', () => {
		const alpha = compileModuleAst(['module alpha', 'int x &zeta:value', 'moduleEnd']);
		const zeta = compileModuleAst(['module zeta', 'push &alpha:value', 'moduleEnd']);

		const sorted = sortModules([alpha, zeta]);

		expect(sorted.map(getModuleId)).toEqual(['zeta', 'alpha']);
	});
});
