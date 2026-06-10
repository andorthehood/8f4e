import stdlibManifest from '@8f4e/stdlib/manifest.json';

type StdlibManifest = {
	includes: Array<{
		id: string;
		path: string;
	}>;
};

const stdlibSourceLoaders = import.meta.glob('./../node_modules/@8f4e/stdlib/std/**/*.8f4e', {
	import: 'default',
	query: '?raw',
}) as Record<string, () => Promise<string>>;

const stdlibIncludeLoaders: Record<string, () => Promise<string>> = Object.fromEntries(
	(stdlibManifest as StdlibManifest).includes.flatMap(include => {
		const packagePath = `@8f4e/stdlib/${include.path}`;
		const nodeModulesPath = `/node_modules/@8f4e/stdlib/${include.path}`;
		const loaderKey = Object.keys(stdlibSourceLoaders).find(
			key =>
				key === packagePath ||
				key === nodeModulesPath ||
				key.endsWith(`/@8f4e/stdlib/${include.path}`) ||
				key.endsWith(`/${include.path}`)
		);

		return loaderKey ? [[include.id, stdlibSourceLoaders[loaderKey]]] : [];
	})
);

export async function resolveStdlibInclude(includeId: string): Promise<string | undefined> {
	return stdlibIncludeLoaders[includeId]?.();
}
