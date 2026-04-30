export type EditorConfigValue = string | number | EditorConfigObject;

export interface EditorConfigObject {
	[key: string]: EditorConfigValue | undefined;
}

export interface EditorConfig extends EditorConfigObject {
	font?: string;
	runtime?: string;
	recompileDebounceDelay?: number;
	color?: EditorConfigObject;
	export?: EditorConfigObject & {
		fileName?: string;
	};
}

export interface EditorConfigEntry {
	path: string;
	value: string;
	rawRow: number;
	codeBlockId: string | number;
}

export type EditorConfigValidator = {
	knownPaths: string[];
	matches: (path: string) => boolean;
	validate: (entry: EditorConfigEntry) => string | undefined;
	parse?: (entry: EditorConfigEntry) => EditorConfigValue;
};

export interface EditorConfigValidatorRegistry {
	[featureId: string]: EditorConfigValidator | undefined;
}
