export { getDocumentProjectBlockType, getProjectBlockType } from './blockClassification';
export { BLOCK_DELIMITERS, FORMAT_HEADER, INCLUDES_BLOCK_DELIMITER } from './delimiters';
export { IncludeFunctionError, resolveFunctionIncludeSource } from './functionIncludes';
export { parseProjectSource as default, parseProjectSource } from './parseProjectSource';
export type {
	PrepareCompilerInputFromProjectSourceTreeOptions,
	ProjectSourceTree,
	ProjectSourceTreeNode,
} from './prepareCompilerInput';
export {
	prepareCompilerInputFromProjectBlocksAsync,
	prepareCompilerInputFromProjectBlocksWithIncludeSourceTreeAsync,
	prepareCompilerInputFromProjectSourceTreeAsync,
} from './prepareCompilerInput';
export { getExpectedProjectCloserPrefix, getProjectCloserKeyword, getProjectOpenerKeyword } from './projectKeywords';
export type { ProjectBlock, ProjectBlockType, ProjectDocument, ProjectGroup } from './types';
