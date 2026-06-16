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

import { ConstantInliningError, ConstantInliningErrorCode, inlineConstantsInAST, inlineConstantsInASTs } from './index';

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
		intermoduleIds: [],
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

describe('constant inlining', () => {
	it('mutates the same AST and line objects while replacing constant references', () => {
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

		const {
			ast: {
				constants: [inlinedSharedAst],
				modules: [inlinedMainAst],
			},
		} = inlineConstantsInASTs({
			ast: {
				prototypes: [],
				modules: [mainAst],
				constants: [sharedAst],
				functions: [],
			},
		});

		expect(inlinedSharedAst).toBe(sharedAst);
		expect(inlinedMainAst).toBe(mainAst);
		expect(inlinedMainAst.lines[1]).toBe(useSharedLine);
		expect(inlinedMainAst.lines[2]).toBe(pushSizeLine);
		expect(inlinedMainAst.lines.map(line => line.lineNumber)).toEqual([20, 21, 22, 23]);
		expect(useSharedLine.arguments[0]).toEqual(id('SHARED', 'constant'));
		expect(sharedConstLine.arguments[0]).toEqual(id('SIZE', 'constant'));
		expect(pushSizeLine.arguments[0]).toEqual(literal(8));
	});

	it('keeps memory operands and only replaces constant operands inside expressions', () => {
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

		inlineConstantsInAST(ast);

		expect(ast.lines[2].arguments[0]).toEqual({
			...sizeTimesElementSize,
			left: literal(4),
		});
		expect(ast.lines[3].arguments[0]).toBe(literalExpression);
	});

	it('throws when a constant declaration needs memory knowledge', () => {
		const mainLine = moduleLine(1, 'main');
		const ast = moduleAst('main', [mainLine, constLine(2, 'BAD', sizeofId('buffer')), moduleEndLine(3)], mainLine);

		expect(() => inlineConstantsInAST(ast)).toThrowError(ConstantInliningError);
		expect(() => inlineConstantsInAST(ast)).toThrowError(ConstantInliningErrorCode.UNRESOLVED_CONSTANT_VALUE);
	});

	it('throws when a used constants namespace cannot be collected', () => {
		const mainLine = moduleLine(1, 'main');
		const ast = moduleAst('main', [mainLine, useLine(2, 'MISSING'), moduleEndLine(3)], mainLine);

		expect(() => inlineConstantsInAST(ast)).toThrowError(ConstantInliningError);
		expect(() => inlineConstantsInAST(ast)).toThrowError(ConstantInliningErrorCode.UNRESOLVED_NAMESPACE);
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

		const input = {
			ast: {
				prototypes: [],
				modules: [module],
				constants: [constants],
				functions: [],
			},
		};

		expect(() => inlineConstantsInASTs(input)).toThrowError(ConstantInliningError);
		expect(() => inlineConstantsInASTs(input)).toThrowError(ConstantInliningErrorCode.DUPLICATE_NAMESPACE);
	});
});
