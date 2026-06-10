const stdlibIncludeLoaders: Record<string, () => Promise<string>> = {
	'std/events/hasChanged': () => import('@8f4e/stdlib/std/events/hasChanged.8f4e?raw').then(module => module.default),
	'std/events/risingEdge': () => import('@8f4e/stdlib/std/events/risingEdge.8f4e?raw').then(module => module.default),
	'std/math/clamp': () => import('@8f4e/stdlib/std/math/clamp.8f4e?raw').then(module => module.default),
};

export async function resolveStdlibInclude(includeId: string): Promise<string | undefined> {
	return stdlibIncludeLoaders[includeId]?.();
}
