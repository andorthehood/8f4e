export default function resolveMemoryId(memoryRef: string, moduleId?: string): string | undefined {
	if (!memoryRef.startsWith('&')) {
		return undefined;
	}

	const withoutPrefix = memoryRef.slice(1);
	if (withoutPrefix.length === 0) {
		return undefined;
	}

	if (withoutPrefix.includes(':')) {
		return withoutPrefix;
	}

	if (!moduleId) {
		return undefined;
	}

	return `${moduleId}:${withoutPrefix}`;
}
