export enum Section {
	CUSTOM = 0x00,
	TYPE = 0x01,
	IMPORT = 0x02,
	FUNCTION = 0x03,
	MEMORY = 0x05,
	EXPORT = 0x07,
	CODE = 0x0a,
}

export enum NameSection {
	FUNCTION_NAME = 0x01,
	LOCAL_NAME = 0x02,
}

export enum ImportDesc {
	MEMORY = 0x02,
}

export enum ExportDesc {
	FUNC = 0x00,
}

export type LocalDeclaration = number[];
export type FunctionBody = number[];
export type FunctionExport = number[];
export type FunctionType = number[];
export type FunctionName = number[];
export type LocalName = number[];
export type Import = number[];

export default Section;
