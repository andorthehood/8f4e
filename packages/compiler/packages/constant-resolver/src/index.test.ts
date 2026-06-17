import type {
	ArgumentCompileTimeExpression,
	ArgumentIdentifier,
	ArgumentLiteral,
	CompilerASTLine,
	ConstantsLine,
	ConstLine,
	ModuleEndLine,
	ModuleLine,
	PushLine,
	UseLine,
	ValidatedConstantsAST,
	ValidatedModuleAST,
} from '@8f4e/language-spec';
import { ArgumentType } from '@8f4e/language-spec';
import { describe, expect, it } from 'vitest';

import { ConstantResolverError, ConstantResolverErrorCode, resolveConstants } from './index';

function id(value: string, referenceKind: 'plain' | 'constant' = 'plain'): ArgumentIdentifier {
	return {
		type: ArgumentType.IDENTIFIER,
		value,
		referenceKind,
		scope: 'local',
	};
}

function literal(value: number): ArgumentLiteral {
	return {
		type: ArgumentType.LITERAL,
		value,
		isInteger: true,
	};
}

function sizeofId(targetMemoryId: string): ArgumentIdentifier {
	return {
		type: ArgumentType.IDENTIFIER,
		value: `sizeof(${targetMemoryId})`,
		referenceKind: 'element-word-size',
		scope: 'local',
		targetMemoryId,
	};
}

function expression(
	left: ArgumentCompileTimeExpression['left'],
	operator: ArgumentCompileTimeExpression['operator'],
	right: ArgumentCompileTimeExpression['right']
): ArgumentCompileTimeExpression {
	return {
		type: ArgumentType.COMPILE_TIME_EXPRESSION,
		left,
		operator,
		right,
	};
}

function moduleLine(lineNumber: number, name: string): ModuleLine {
	return {
		lineNumber,
		instruction: 'module',
		arguments: [id(name)],
	};
}

function moduleEndLine(lineNumber: number): ModuleEndLine {
	return {
		lineNumber,
		instruction: 'moduleEnd',
		arguments: [],
	};
}

function constantsLine(lineNumber: number, name: string): ConstantsLine {
	return {
		lineNumber,
		instruction: 'constants',
		arguments: [id(name)],
	};
}

function useLine(lineNumber: number, name: string): UseLine {
	return {
		lineNumber,
		instruction: 'use',
		arguments: [id(name, 'constant')],
	};
}

function constLine(lineNumber: number, name: string, value: ConstLine['arguments'][1]): ConstLine {
	return {
		lineNumber,
		instruction: 'const',
		arguments: [id(name, 'constant'), value],
	};
}

function pushLine(lineNumber: number, value: PushLine['arguments'][0]): PushLine {
	return {
		lineNumber,
		instruction: 'push',
		arguments: [value],
	};
}

function constantsAst(id: string, lines: CompilerASTLine[], constantsLineRef: ConstantsLine): ValidatedConstantsAST {
	return {
		type: 'constants',
		id,
		lines,
		constantsLine: constantsLineRef,
	} as unknown as ValidatedConstantsAST;
}

function moduleAst(id: string, lines: CompilerASTLine[], moduleLineRef: ModuleLine): ValidatedModuleAST {
	return {
		type: 'module',
		id,
		lines,
		moduleLine: moduleLineRef,
		memoryDeclarationLines: [],
	} as unknown as ValidatedModuleAST;
}

describe('constant resolver', () => {
	it('keeps AST lines immutable while reporting resolved constant arguments', () => {
		const sharedLine = constantsLine(10, 'SHARED');
		const sharedConstLine = constLine(11, 'SIZE', literal(8));
		const sharedAst = constantsAst(
			'SHARED',
			[sharedLine, sharedConstLine, { lineNumber: 12, instruction: 'constantsEnd', arguments: [] }],
			sharedLine
		);
		const mainLine = moduleLine(20, 'main');
		const useSharedLine = useLine(21, 'SHARED');
		const pushSizeLine = pushLine(22, id('SIZE', 'constant'));
		const mainAst = moduleAst('main', [mainLine, useSharedLine, pushSizeLine, moduleEndLine(23)], mainLine);

		const result = resolveConstants({
			ast: {
				prototypes: [],
				modules: [mainAst],
				constants: [sharedAst],
				functions: [],
			},
		});

		expect(mainAst.lines[1]).toBe(useSharedLine);
		expect(mainAst.lines[2]).toBe(pushSizeLine);
		expect(useSharedLine.arguments[0]).toEqual(id('SHARED', 'constant'));
		expect(sharedConstLine.arguments[0]).toEqual(id('SIZE', 'constant'));
		expect(pushSizeLine.arguments[0]).toEqual(id('SIZE', 'constant'));
		expect(result).toMatchSnapshot();
	});

	it('keeps memory operands and only resolves constant operands inside expressions', () => {
		const mainLine = moduleLine(1, 'main');
		const sizeTimesElementSize = expression(id('SIZE', 'constant'), '*', sizeofId('buffer'));
		const literalExpression = expression(literal(2), '*', literal(3));
		const ast = moduleAst(
			'main',
			[
				mainLine,
				constLine(2, 'SIZE', literal(4)),
				pushLine(3, sizeTimesElementSize),
				pushLine(4, literalExpression),
				moduleEndLine(5),
			],
			mainLine
		);

		const result = resolveConstants({
			ast: {
				prototypes: [],
				modules: [ast],
				constants: [],
				functions: [],
			},
		});

		expect(ast.lines[2].arguments[0]).toBe(sizeTimesElementSize);
		expect(result.references.modules[0].lineFacts[2]).toEqual({
			arguments: [
				{
					...sizeTimesElementSize,
					left: literal(4),
				},
			],
		});
		expect(result.references.modules[0].lineFacts[3]).toBeUndefined();
	});

	it('throws when a constant declaration needs memory knowledge', () => {
		const mainLine = moduleLine(1, 'main');
		const ast = moduleAst('main', [mainLine, constLine(2, 'BAD', sizeofId('buffer')), moduleEndLine(3)], mainLine);

		expect(() =>
			resolveConstants({
				ast: {
					prototypes: [],
					modules: [ast],
					constants: [],
					functions: [],
				},
			})
		).toThrowError(ConstantResolverError);
		expect(() =>
			resolveConstants({
				ast: {
					prototypes: [],
					modules: [ast],
					constants: [],
					functions: [],
				},
			})
		).toThrowError(ConstantResolverErrorCode.UNRESOLVED_CONSTANT_VALUE);
	});

	it('throws when a used constants namespace cannot be collected', () => {
		const mainLine = moduleLine(1, 'main');
		const ast = moduleAst('main', [mainLine, useLine(2, 'MISSING'), moduleEndLine(3)], mainLine);

		expect(() =>
			resolveConstants({
				ast: {
					prototypes: [],
					modules: [ast],
					constants: [],
					functions: [],
				},
			})
		).toThrowError(ConstantResolverError);
		expect(() =>
			resolveConstants({
				ast: {
					prototypes: [],
					modules: [ast],
					constants: [],
					functions: [],
				},
			})
		).toThrowError(ConstantResolverErrorCode.UNRESOLVED_NAMESPACE);
	});

	it('throws when a module and constants block share a constant namespace id', () => {
		const sharedConstantsLine = constantsLine(1, 'shared');
		const constants = constantsAst(
			'shared',
			[
				sharedConstantsLine,
				constLine(2, 'VALUE', literal(1)),
				{ lineNumber: 3, instruction: 'constantsEnd', arguments: [] },
			],
			sharedConstantsLine
		);
		const sharedModuleLine = moduleLine(4, 'shared');
		const module = moduleAst('shared', [sharedModuleLine, moduleEndLine(5)], sharedModuleLine);

		expect(() =>
			resolveConstants({
				ast: {
					prototypes: [],
					modules: [module],
					constants: [constants],
					functions: [],
				},
			})
		).toThrowError(ConstantResolverError);
		expect(() =>
			resolveConstants({
				ast: {
					prototypes: [],
					modules: [module],
					constants: [constants],
					functions: [],
				},
			})
		).toThrowError(ConstantResolverErrorCode.DUPLICATE_NAMESPACE);
	});
});
