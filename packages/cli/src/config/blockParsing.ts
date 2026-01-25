const CONFIG_WITH_TYPE_REGEX = /^\s*config\s+\S+/;

export function extractConfigType(code: string[]): string | null {
	for (const line of code) {
		const match = /^\s*config\s+(\S+)/.exec(line);
		if (match) {
			return match[1];
		}
	}
	return null;
}

export function extractConfigBody(code: string[]): string[] {
	let startIndex = -1;
	let endIndex = -1;

	for (let i = 0; i < code.length; i += 1) {
		if (CONFIG_WITH_TYPE_REGEX.test(code[i])) {
			startIndex = i;
		} else if (/^\s*configEnd(\s|$)/.test(code[i])) {
			endIndex = i;
		}
	}

	if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) {
		return [];
	}

	return code.slice(startIndex + 1, endIndex);
}
