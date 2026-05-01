import type { CodeBlockGraphicData } from '@8f4e/editor-state-types';

export interface BinaryAssetDefinition {
	id: string;
	url: string;
}

export interface BinaryAssetLoadDirective {
	assetId: string;
	memoryRef: string;
	moduleId?: string;
}

export interface ParsedBinaryAssetDirectives {
	definitionsById: Map<string, BinaryAssetDefinition>;
	loadDirectives: BinaryAssetLoadDirective[];
}

export default function parseBinaryAssetDirectives(codeBlocks: CodeBlockGraphicData[]): ParsedBinaryAssetDirectives {
	const definitionsById = new Map<string, BinaryAssetDefinition>();
	const loadDirectives: BinaryAssetLoadDirective[] = [];

	for (const codeBlock of codeBlocks) {
		for (const line of codeBlock.code) {
			const commentMatch = line.match(/^\s*;\s*@(\w+)\s+(.*)/);
			if (!commentMatch) {
				continue;
			}

			const directive = commentMatch[1];
			const args = commentMatch[2].trim().split(/\s+/);

			if (directive === 'defAsset') {
				if (args.length < 2) {
					continue;
				}

				const [id, url] = args;
				if (!id || !url) {
					continue;
				}

				definitionsById.set(id, { id, url });
				continue;
			}

			if (directive === 'loadAsset') {
				if (args.length < 2) {
					continue;
				}

				const [assetId, memoryRef] = args;
				if (!assetId || !memoryRef) {
					continue;
				}

				loadDirectives.push({ assetId, memoryRef, moduleId: codeBlock.moduleId });
			}
		}
	}

	return { definitionsById, loadDirectives };
}
