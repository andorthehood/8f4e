import type { ParsedLineMetadata } from '../types';

function appendHashInput(hash: number, input: string): number {
	let nextHash = hash;
	for (let index = 0; index < input.length; index++) {
		nextHash ^= input.charCodeAt(index);
		nextHash = Math.imul(nextHash, 16777619);
	}
	return nextHash >>> 0;
}

export default function hashSource(code: string[], lineMetadata: ParsedLineMetadata | undefined): number {
	let hash = 2166136261;
	hash = appendHashInput(hash, `${code.length}\0`);
	for (const line of code) {
		hash = appendHashInput(hash, `${line.length}\0${line}\0`);
	}

	hash = appendHashInput(hash, `${lineMetadata?.length ?? 0}\0`);
	if (lineMetadata) {
		for (const metadata of lineMetadata) {
			hash = appendHashInput(hash, `${metadata.callSiteLineNumber}\0${metadata.macroId ?? ''}\0`);
		}
	}

	return hash >>> 0;
}
