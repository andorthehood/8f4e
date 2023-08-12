export function codeToRegex(code: string[]) {
	return new RegExp(
		code
			.map(line => {
				return `\\s*${line.replace(' ', '\\s+').replace(/:(\S+)/, '(?<$1>\\S+)')}[^\\S\\n]*`;
			})
			.join('\n'),
		'gm'
	);
}

export function parseCode(code: string[], pattern: string[]) {
	return codeToRegex(pattern).exec(code.filter(line => !/^\s*$/gm.test(line)).join('\n'))?.groups;
}

export function replaceCode(code: string[], pattern: string[], replaceWith: string[]) {
	const newCode = code
		.filter(line => !/^\s*$/gm.test(line))
		.join('\n')
		.replace(codeToRegex(pattern), replaceWith.join('\n'));

	if (newCode === '') {
		return [];
	}
	return newCode.split('\n');
}
