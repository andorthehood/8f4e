export default function parseButtons(code: string[]) {
	return code.reduce(
		(acc, line, index) => {
			// Match semicolon comment lines with @button directive
			const commentMatch = line.match(/^\s*;\s*@(\w+)\s+(.*)/);
			if (commentMatch && commentMatch[1] === 'button') {
				const args = commentMatch[2].trim().split(/\s+/);
				const id = args[0];
				const offValue = parseInt(args[1], 10) || 0;
				const onValue = parseInt(args[2], 10) || 1;
				return [...acc, { id, lineNumber: index, onValue, offValue }];
			}
			return acc;
		},
		[] as Array<{ id: string; lineNumber: number; onValue: number; offValue: number }>
	);
}
