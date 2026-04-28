export type EditorConfigValue = string | EditorConfig;

export interface EditorConfig {
	[key: string]: EditorConfigValue | undefined;
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
};

export interface EditorConfigValidatorRegistry {
	[featureId: string]: EditorConfigValidator | undefined;
}
