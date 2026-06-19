export { getDocumentProjectBlockType, getProjectBlockType } from './blockClassification';
export { BLOCK_DELIMITERS, FORMAT_HEADER, INCLUDES_BLOCK_DELIMITER } from './delimiters';
export type { ProjectIncludeResolver, ProjectIncludeResolverAsync } from './functionIncludes';
export {
	collectProjectIncludeIdsFromText,
	ProjectIncludeError,
	resolveFunctionIncludeSource,
	resolveProjectIncludes,
	resolveProjectIncludesAsync,
} from './functionIncludes';
export { parseProjectSource as default, parseProjectSource } from './parseProjectSource';
export type {
	PrepareCompilerInputFromProjectSourceTreeOptions,
	PrepareCompilerInputOptions,
	ProjectSourceTree,
	ProjectSourceTreeNode,
} from './prepareCompilerInput';
export {
	prepareCompilerInputAsync,
	prepareCompilerInputFromProjectBlocksAsync,
	prepareCompilerInputFromProjectSourceAsync,
	prepareCompilerInputFromProjectSourceTreeAsync,
} from './prepareCompilerInput';
export { getExpectedProjectCloserPrefix, getProjectCloserKeyword, getProjectOpenerKeyword } from './projectKeywords';
export type { ProjectBlock, ProjectBlockType, ProjectDocument, ProjectGroup } from './types';
