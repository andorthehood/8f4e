import { parse8f4eProjectAsync } from '@8f4e/tokenizer';
import { resolveStdlibInclude } from './stdlibResolver';

export default function parse8f4eToProject(source: string) {
	return parse8f4eProjectAsync(source, {
		resolveInclude: resolveStdlibInclude,
	});
}
