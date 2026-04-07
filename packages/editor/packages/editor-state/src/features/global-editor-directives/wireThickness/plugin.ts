import { createGlobalEditorDirectivePlugin } from '../utils';

function parseWireThickness(rawValue: string): number | null {
	const value = Number(rawValue);
	if (!Number.isFinite(value) || value < 1 || value > 100) {
		return null;
	}

	return value;
}

export default createGlobalEditorDirectivePlugin('wireThickness', (directive, draft, context) => {
	if (directive.args.length !== 1) {
		draft.errors.push({
			lineNumber: directive.rawRow,
			message: '@wireThickness requires exactly 1 argument: <number>',
			codeBlockId: context.codeBlockId,
		});
		return;
	}

	const thickness = parseWireThickness(directive.args[0]);
	if (thickness === null) {
		draft.errors.push({
			lineNumber: directive.rawRow,
			message: `@wireThickness: invalid value '${directive.args[0]}'`,
			codeBlockId: context.codeBlockId,
		});
		return;
	}

	const currentValue = draft.resolved.wireThickness;
	if (currentValue === undefined) {
		draft.resolved.wireThickness = thickness;
		return;
	}

	if (currentValue !== thickness) {
		draft.errors.push({
			lineNumber: directive.rawRow,
			message: `@wireThickness: conflicting values '${currentValue}' and '${thickness}'`,
			codeBlockId: context.codeBlockId,
		});
	}
});

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('@wireThickness global editor directive', () => {
		it('resolves a valid thickness', async () => {
			const { resolveGlobalEditorDirectives } = await import('../registry');

			const result = resolveGlobalEditorDirectives(
				[
					{
						parsedDirectives: [{ prefix: '@', name: 'wireThickness', args: ['3'], rawRow: 1, isTrailing: false }],
					},
				],
				{}
			);

			expect(result.resolved.wireThickness).toBe(3);
			expect(result.errors).toEqual([]);
		});

		it('reports invalid values', async () => {
			const { resolveGlobalEditorDirectives } = await import('../registry');

			const result = resolveGlobalEditorDirectives(
				[
					{
						id: 'wires',
						parsedDirectives: [
							{ prefix: '@', name: 'wireThickness', args: ['0'], rawRow: 2, isTrailing: false },
							{ prefix: '@', name: 'wireThickness', args: ['101'], rawRow: 3, isTrailing: false },
						],
					},
				],
				{}
			);

			expect(result.resolved.wireThickness).toBeUndefined();
			expect(result.errors).toEqual([
				{
					lineNumber: 2,
					message: "@wireThickness: invalid value '0'",
					codeBlockId: 'wires',
				},
				{
					lineNumber: 3,
					message: "@wireThickness: invalid value '101'",
					codeBlockId: 'wires',
				},
			]);
		});

		it('reports conflicting values', async () => {
			const { resolveGlobalEditorDirectives } = await import('../registry');

			const result = resolveGlobalEditorDirectives(
				[
					{
						parsedDirectives: [{ prefix: '@', name: 'wireThickness', args: ['2'], rawRow: 1, isTrailing: false }],
					},
					{
						parsedDirectives: [{ prefix: '@', name: 'wireThickness', args: ['4'], rawRow: 2, isTrailing: false }],
					},
				],
				{}
			);

			expect(result.resolved.wireThickness).toBe(2);
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0].message).toContain('conflicting values');
		});
	});
}
