export default function parseDebuggers(code: string[]) {
	return code.reduce(
		(acc, line, index) => {
			// Match semicolon comment lines with @debug directive
			const commentMatch = line.match(/^\s*;\s*@(\w+)\s+(.*)/);
			if (commentMatch && commentMatch[1] === 'debug') {
				const id = commentMatch[2].trim();
				return [...acc, { id, lineNumber: index }];
			}
			return acc;
		},
		[] as Array<{ id: string; lineNumber: number }>
	);
}
