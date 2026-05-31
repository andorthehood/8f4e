import type { ProjectCodeBlock } from '@8f4e/tokenizer';
import { parse8f4eProject } from '@8f4e/tokenizer';
import { FORMAT_HEADER } from '~/features/project-format';
import { parseBlockDirectives } from '../../utils/parseBlockDirectives';
import removeDirective from '../../utils/removeDirective';

const PUBLIC_BLOCK_DIRECTIVE = 'public';

function hasPublicDirective(block: ProjectCodeBlock): boolean {
	return parseBlockDirectives(block.code).some(
		directive => directive.prefix === '@' && directive.name === PUBLIC_BLOCK_DIRECTIVE
	);
}

export default function extractPublicBlockFromModuleSource(source: string): string[] {
	const lines = source.split('\n');
	if (lines[0]?.trim() !== FORMAT_HEADER) {
		return lines;
	}

	const project = parse8f4eProject(source);
	const [publicBlock] = project.codeBlocks.filter(block => block.entry !== 'test' && hasPublicDirective(block));

	return publicBlock ? removeDirective(publicBlock.code, PUBLIC_BLOCK_DIRECTIVE) : [];
}
