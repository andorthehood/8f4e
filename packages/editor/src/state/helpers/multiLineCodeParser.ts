function escapeRegExp(text: string) {
	return text.replaceAll(/[[\]]/g, `\\$&`);
}

export function lineToRegexString(line: string) {
	return `\\s*${escapeRegExp(line)
		.replaceAll(' ', '\\s+')
		.replaceAll(/:([\d\w]+)/g, '(?<$1>\\S+)')}[^\\S\\n]*`;
}

export function codeToRegex(code: string[]) {
	return new RegExp(
		code
			.map(line => {
				return lineToRegexString(line);
			})
			.join('\n'),
		'gm'
	);
}

export function parseCode(code: string[], pattern: string[]) {
	const regex = codeToRegex(pattern);
	const codeWithoutEmptyLines = code.filter(line => !/^\s*$/gm.test(line)).join('\n');

	let groups: Record<string, string> | undefined;
	const data: Record<string, string>[] = [];

	while ((groups = regex.exec(codeWithoutEmptyLines)?.groups)) {
		data.push(groups);
	}

	return data;
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

export function insertCodeAfterLine(lineToFind: string, code: string[], codeToInsert: string[]) {
	const regexp = new RegExp(lineToRegexString(lineToFind), 'gm');

	const indexToInsert =
		code.findIndex(line => {
			return regexp.test(line);
		}) + 1;

	return [...code.slice(0, indexToInsert), ...codeToInsert, ...code.slice(indexToInsert)];
}
