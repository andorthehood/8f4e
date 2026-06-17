import type { CompilationContext, SemanticInstructionLine } from '@8f4e/language-spec';
import { BlockType, compilerSourceBlockInstructionByType, resolveRegionDirective } from '@8f4e/language-spec';
import { popBlock, pushBlock } from '@8f4e/semantic-utils';

const moduleBlockType = compilerSourceBlockInstructionByType.module.type;

/**
 * Applies module-level semantic source lines needed while codegen walks module bodies.
 *
 * @param line - Semantic AST line being processed.
 * @param context - Compilation context mutated by the operation.
 * @returns Nothing.
 */
export function applySemanticLine(line: SemanticInstructionLine, context: CompilationContext): void {
	switch (line.instruction) {
		case 'const':
		case 'use':
			return;
		case 'module': {
			const moduleId = line.arguments[0].value;
			pushBlock(context, { expectedResultTypes: [], blockType: BlockType.MODULE });
			context.namespace.moduleName = moduleId;
			context.codeBlockId = moduleId;
			context.codeBlockType = moduleBlockType;
			return;
		}
		case '#region': {
			const region = resolveRegionDirective(line, context);
			context.currentMemoryIndex = region.memoryIndex;
			if (region.memoryRegionName) {
				context.currentMemoryRegionName = region.memoryRegionName;
			} else {
				delete context.currentMemoryRegionName;
			}
			return;
		}
		case 'moduleEnd':
			popBlock(context);
			return;
		case 'shape': {
			const prototypeId = line.arguments[0].value;
			if (!context.namespace.prototypeShapeIds.includes(prototypeId)) {
				context.namespace.prototypeShapeIds.push(prototypeId);
			}
			return;
		}
	}
}
