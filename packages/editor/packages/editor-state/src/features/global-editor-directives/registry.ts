import configDirective from './config/plugin';
import infoOverlayDirective from './infoOverlay/plugin';
import keyCodeMemoryDirective from './keyboardMemory/keyCodeMemory/plugin';
import keyPressedMemoryDirective from './keyboardMemory/keyPressedMemory/plugin';
import { parseGlobalEditorDirectives } from './utils';

import type { CodeError, ParsedDirectiveRecord, CodeBlockType } from '~/types';
import type {
	GlobalEditorDirectiveContext,
	GlobalEditorDirectiveResolutionResult,
	GlobalEditorDirectivePlugin,
	ParsedGlobalEditorDirective,
	ResolvedGlobalEditorDirectives,
} from './types';
import type { RuntimeRegistry } from '../runtime/types';

export const globalEditorDirectivePlugins: GlobalEditorDirectivePlugin[] = [
	configDirective,
	infoOverlayDirective,
	keyCodeMemoryDirective,
	keyPressedMemoryDirective,
];

export function resolveGlobalEditorDirectives(
	codeBlocks: {
		parsedDirectives: ParsedDirectiveRecord[];
		id?: string;
		moduleId?: string;
		blockType?: CodeBlockType;
	}[],
	runtimeRegistry: RuntimeRegistry,
	plugins: GlobalEditorDirectivePlugin[] = globalEditorDirectivePlugins
): GlobalEditorDirectiveResolutionResult {
	const pluginMap = new Map(plugins.map(plugin => [plugin.name, plugin]));
	const draft: {
		resolved: ResolvedGlobalEditorDirectives;
		errors: CodeError[];
	} = {
		resolved: {},
		errors: [],
	};

	for (let blockIndex = 0; blockIndex < codeBlocks.length; blockIndex++) {
		const block = codeBlocks[blockIndex];
		const directives: ParsedGlobalEditorDirective[] = parseGlobalEditorDirectives(block.parsedDirectives, plugins);
		const codeBlockId: string | number = block.id ?? blockIndex;
		const context: GlobalEditorDirectiveContext = {
			codeBlockId,
			moduleId: block.moduleId,
			blockType: block.blockType,
			runtimeRegistry,
		};

		for (const directive of directives) {
			pluginMap.get(directive.name)?.apply?.(directive, draft, context);
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
			const result = resolveGlobalEditorDirectives(
				[
					{
						parsedDirectives: [
							{
								prefix: '@',
								name: 'unknown',
								args: ['x'],
								rawRow: 0,
								isTrailing: false,
							},
						],
					},
				],
				{}
			);

			expect(result.resolved).toEqual({});
			expect(result.errors).toEqual([]);
		});
	});
}
