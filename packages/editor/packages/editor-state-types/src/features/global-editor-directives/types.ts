/**
 * Types for global editor directives.
 * Editor directives use `; @<name> <args...>` syntax.
 */
import type { CodeError } from '../../shared/types';
import type { EditorConfigEntry } from '../editor-config/types';
import type { CodeBlockType } from '../code-blocks/types';
import type { RuntimeRegistry } from '../runtime/types';

export interface ParsedGlobalEditorDirective {
	name: string;
	rawRow: number;
	args: string[];
}

export interface ResolvedGlobalEditorDirectives {
	/** Source entries for config validation/error reporting */
	configEntries?: EditorConfigEntry[];
	/** Target memory for keyboard HID usage codes */
	keyCodeMemoryId?: string;
	/** Target memory for keyboard pressed-state flag */
	keyPressedMemoryId?: string;
}

export interface GlobalEditorDirectiveContext {
	codeBlockId: string | number;
	moduleId?: string;
	blockType?: CodeBlockType;
	runtimeRegistry: RuntimeRegistry;
}

export interface GlobalEditorDirectivePlugin {
	name: string;
	apply?: (
		directive: ParsedGlobalEditorDirective,
		draft: GlobalEditorDirectiveResolutionResult,
		context: GlobalEditorDirectiveContext
	) => void;
}

export interface GlobalEditorDirectiveResolutionResult {
	resolved: ResolvedGlobalEditorDirectives;
	errors: CodeError[];
}
