/**
 * Types for global editor directives.
 * Editor directives use `; @<name> <args...>` syntax.
 */
import type { ColorScheme, Font } from '@8f4e/sprite-generator';
import type { CodeError } from '~/types';
import type { CodeBlockType } from '../code-blocks/types';
import type { RuntimeRegistry } from '../runtime/types';

export interface ParsedGlobalEditorDirective {
	name: string;
	rawRow: number;
	args: string[];
}

export interface ResolvedGlobalEditorDirectives {
	/** Selected editor font from `; @config font <font>` directives */
	font?: Font;
	/** Enable or disable the info overlay from `; @infoOverlay <on|off>` directives */
	infoOverlay?: boolean;
	/** Export file base name from `; @exportFileName <value>` directives */
	exportFileName?: string;
	/** Selected runtime host from `; @runtime <id>` directives */
	runtime?: string;
	/** Target memory for keyboard HID usage codes */
	keyCodeMemoryId?: string;
	/** Target memory for keyboard pressed-state flag */
	keyPressedMemoryId?: string;
	/** Resolved editor color overrides merged on top of the default color scheme */
	colorScheme?: ColorScheme;
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
