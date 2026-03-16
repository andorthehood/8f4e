import exportFileNameDirective from './exportFileName/plugin';
import { parseGlobalEditorDirectives } from './utils';

import type { CodeError, ParsedDirectiveRecord } from '~/types';
import type {
	GlobalEditorDirectiveResolutionResult,
	GlobalEditorDirectivePlugin,
	ParsedGlobalEditorDirective,
	ResolvedGlobalEditorDirectives,
} from './types';

export const globalEditorDirectivePlugins: GlobalEditorDirectivePlugin[] = [exportFileNameDirective];

export function resolveGlobalEditorDirectives(
	codeBlocks: { parsedDirectives: ParsedDirectiveRecord[]; id?: string }[],
	plugins: GlobalEditorDirectivePlugin[] = globalEditorDirectivePlugins
): GlobalEditorDirectiveResolutionResult {
	const pluginMap = new Map(plugins.map(plugin => [plugin.name, plugin]));
	const draft: { resolved: ResolvedGlobalEditorDirectives; errors: CodeError[] } = {
		resolved: {},
		errors: [],
	};

	for (let blockIndex = 0; blockIndex < codeBlocks.length; blockIndex++) {
		const block = codeBlocks[blockIndex];
		const directives: ParsedGlobalEditorDirective[] = parseGlobalEditorDirectives(block.parsedDirectives, plugins);
		const codeBlockId: string | number = block.id ?? blockIndex;

		for (const directive of directives) {
			pluginMap.get(directive.name)?.apply?.(directive, draft, { codeBlockId });
		}
	}

	return {
		resolved: draft.resolved,
		errors: draft.errors,
	};
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('global editor directive registry', () => {
		it('ignores unregistered directives', () => {
			const result = resolveGlobalEditorDirectives([
				{
					parsedDirectives: [
						{ prefix: '@', name: 'unknown', args: ['x'], rawRow: 0 },
						{ prefix: '@', name: 'exportFileName', args: ['demo'], rawRow: 1 },
					],
				},
			]);

			expect(result.resolved).toEqual({ exportFileName: 'demo' });
			expect(result.errors).toEqual([]);
		});
	});
}
