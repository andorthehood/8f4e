import {
	createFunctionBody,
	createLocalDeclaration,
	i32const,
	i32load,
	localGet,
	localSet,
	Type,
} from 'bytecode-utils';
type Argument = { type: 'literal'; value: number } | { type: 'identifier'; value: string };
type AST = Array<{ instruction: string; arguments: Array<Argument> }>;

const memoryKeywords = ['private', 'inputPointer', 'output'];

function parseArgument(argument: string): Argument {
	return /[0-9]/.test(argument)
		? { value: parseInt(argument, 10), type: 'literal' }
		: { value: argument, type: 'identifier' };
}

function parseLine(line: string): AST[number] {
	const [, instruction, ...args] = line.match(/\s*(\S+)\s*(\S*)\s*(\S*)/);

	return {
		instruction,
		arguments: args
			.filter(argument => {
				return argument !== '';
			})
			.map(parseArgument),
	};
}

function isComment(line: string): boolean {
	return /\s*#/.test(line);
}

function isValidInstruction(line: string): boolean {
	return /\s*(\S+)\s*(\S*)\s*(\S*)/.test(line);
}

function collectLocals(ast: AST): string[] {
	return ast.reduce((acc, line) => {
		if (line.instruction === 'local' && line.arguments[0].type === 'identifier') {
			acc.push(line.arguments[0].value);
		}
		return acc;
	}, [] as string[]);
}

function collectMemoryItemNames(ast: AST): string[] {
	return ast.reduce((acc, line) => {
		if (memoryKeywords.includes(line.instruction) && line.arguments[0].type === 'identifier') {
			acc.push(line.arguments[0].value);
		}
		return acc;
	}, [] as string[]);
}

export function compileToAST(module: string) {
	const lines = module.split('\n');

	return lines
		.filter(line => !isComment(line))
		.filter(line => isValidInstruction(line))
		.map(line => {
			return parseLine(line);
		});
}

export function compileLine(line: AST[number], locals: string[], memory: string[]): number[] {
	switch (line.instruction) {
		case 'const':
			if (line.arguments[0].type === 'identifier') {
				return i32const(memory.indexOf(line.arguments[0].value));
			} else {
				return i32const(line.arguments[0].value);
			}
		case 'load':
			return i32load();
		case 'localSet':
			if (line.arguments[0].type === 'identifier') {
				return localSet(locals.indexOf(line.arguments[0].value));
			} else {
				return localSet(line.arguments[0].value);
			}
		case 'localGet':
			if (line.arguments[0].type === 'identifier') {
				return localGet(locals.indexOf(line.arguments[0].value));
			} else {
				return localGet(line.arguments[0].value);
			}
		default:
			return [0];
	}
}

export function compile(ast: AST): number[] {
	const locals = collectLocals(ast);
	const memory = collectMemoryItemNames(ast);

	console.log('locals', locals);
	console.log('memory', memory);

	const wa = ast
		.reduce((acc, line) => {
			acc.push(compileLine(line, locals, memory));
			return acc;
		}, [] as number[][])
		.flat();

	return createFunctionBody([createLocalDeclaration(Type.I32, locals.length)], wa);
}
