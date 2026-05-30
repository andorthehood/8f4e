/**
 * Types for project import/export feature - project serialization and metadata.
 */

import type { CodeBlock } from '../code-blocks/types';

/**
 * Complete project structure for serialization and loading.
 */
export interface Project {
	codeBlocks: CodeBlock[];
}
