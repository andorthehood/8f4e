export const Section = {
	CUSTOM: 0x00,
	TYPE: 0x01,
	IMPORT: 0x02,
	FUNCTION: 0x03,
	MEMORY: 0x05,
	EXPORT: 0x07,
	CODE: 0x0a,
	DATA: 0x0b,
	DATA_COUNT: 0x0c,
} as const;

export type SectionValue = (typeof Section)[keyof typeof Section];

export const NameSection = {
	FUNCTION_NAME: 0x01,
	LOCAL_NAME: 0x02,
} as const;

export type NameSectionValue = (typeof NameSection)[keyof typeof NameSection];

export const ImportDesc = {
	MEMORY: 0x02,
} as const;

export type ImportDescValue = (typeof ImportDesc)[keyof typeof ImportDesc];

export const ExportDesc = {
	FUNC: 0x00,
} as const;

export type ExportDescValue = (typeof ExportDesc)[keyof typeof ExportDesc];

export type LocalDeclaration = number[];
export type FunctionBody = number[];
export type FunctionExport = number[];
export type FunctionType = number[];
export type FunctionName = number[];
export type LocalName = number[];
export type Import = number[];
export type DataSegment = number[];

export default Section;
