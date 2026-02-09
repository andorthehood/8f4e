export default function parseBufferScanners(code: string[]) {
	return code.reduce(
		(acc, line, index) => {
			// Match semicolon comment lines with @scan directive
			const commentMatch = line.match(/^\s*;\s*@(\w+)\s+(.*)/);
			if (commentMatch && commentMatch[1] === 'scan') {
				const args = commentMatch[2].trim().split(/\s+/);
				return [
					...acc,
					{
						bufferMemoryId: args[0],
						pointerMemoryId: args[1],
						lineNumber: index,
					},
				];
			}

			return acc;
		},
		[] as Array<{
			bufferMemoryId: string;
			pointerMemoryId: string;
			lineNumber: number;
		}>
	);
}
