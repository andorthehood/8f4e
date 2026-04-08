import { classifyIdentifier } from '@8f4e/tokenizer';

import type { AST } from '../../types';

/**
 * Pre-pass that pairs `if` with its matching `ifEnd` and moves the result type
 * argument from the closing `ifEnd` to the opening `if`.
 *
 * Surface syntax:
 *   if
 *     ...
 *   ifEnd         ; no result
 *
 *   if
 *     ...
 *   ifEnd int     ; integer result
 *
 *   if
 *     ...
 *   ifEnd float   ; float result
 *
 * After normalization the internal form is the same as the previous surface
 * syntax: `if` carries the result type (or `void` when absent) so that codegen
 * can emit the WebAssembly block type before entering the block body.
 */
export default function normalizeIfBlocks(ast: AST): AST {
	// Shallow-clone the AST, also spreading the `arguments` array on each line
	// so mutations below don't affect the caller's original AST.
	const result: AST = ast.map(line => ({ ...line, arguments: [...line.arguments] }));

	// Stack of indices into `result`. Each entry is either the index of an `if`
	// line (so we can back-patch it) or `null` for any other block opener
	// (`block`, `loop`, `function`) that contributes to nesting depth.
	const stack: (number | null)[] = [];

	for (let i = 0; i < result.length; i++) {
		const instruction = result[i].instruction;

		if (instruction === 'if') {
			stack.push(i);
		} else if (instruction === 'block' || instruction === 'loop' || instruction === 'function') {
			stack.push(null);
		} else if (
			instruction === 'ifEnd' ||
			instruction === 'blockEnd' ||
			instruction === 'loopEnd' ||
			instruction === 'functionEnd'
		) {
			const opener = stack.pop();

			if (instruction === 'ifEnd' && opener !== null && opener !== undefined) {
				const ifLine = result[opener];
				const ifEndLine = result[i];

				if (ifEndLine.arguments.length > 0) {
					// Move the result type from ifEnd to if
					ifLine.arguments = [ifEndLine.arguments[0]];
					ifEndLine.arguments = [];
				} else {
					// Bare ifEnd — inject void on if to represent no result
					ifLine.arguments = [classifyIdentifier('void')];
				}
			}
		}
	}

	return result;
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;
	const { parseLine } = await import('@8f4e/tokenizer');

	const parse = (src: string) =>
		src
			.split('\n')
			.filter(l => l.trim())
			.map((l, i) => parseLine(l, i));

	describe('normalizeIfBlocks', () => {
		it('moves int result type from ifEnd to if', () => {
			const ast = parse(`push 1\nif\npush 10\nifEnd int`);
			const result = normalizeIfBlocks(ast);

			const ifLine = result.find(l => l.instruction === 'if')!;
			const ifEndLine = result.find(l => l.instruction === 'ifEnd')!;

			expect(ifLine.arguments).toHaveLength(1);
			expect(ifLine.arguments[0]).toMatchObject({ value: 'int' });
			expect(ifEndLine.arguments).toHaveLength(0);
		});

		it('moves float result type from ifEnd to if', () => {
			const ast = parse(`push 1\nif\npush 1.0\nifEnd float`);
			const result = normalizeIfBlocks(ast);

			const ifLine = result.find(l => l.instruction === 'if')!;
			expect(ifLine.arguments[0]).toMatchObject({ value: 'float' });
		});

		it('injects void on if for bare ifEnd', () => {
			const ast = parse(`push 1\nif\npush 1\nifEnd`);
			const result = normalizeIfBlocks(ast);

			const ifLine = result.find(l => l.instruction === 'if')!;
			expect(ifLine.arguments[0]).toMatchObject({ value: 'void' });
		});

		it('handles nested if blocks', () => {
			// Outer void, inner int
			const ast = parse(['push 1', 'if', ' push 1', ' if', '  push 10', ' ifEnd int', 'ifEnd'].join('\n'));
			const result = normalizeIfBlocks(ast);

			const ifLines = result.filter(l => l.instruction === 'if');
			expect(ifLines[0].arguments[0]).toMatchObject({ value: 'void' }); // outer
			expect(ifLines[1].arguments[0]).toMatchObject({ value: 'int' }); // inner
		});
	});
}
