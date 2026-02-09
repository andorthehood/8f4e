export default function parseBufferPlotters(code: string[]) {
	return code.reduce(
		(acc, line, index) => {
			// Match semicolon comment lines with @plot directive
			const commentMatch = line.match(/^\s*;\s*@(\w+)\s+(.*)/);
			if (commentMatch && commentMatch[1] === 'plot') {
				const args = commentMatch[2].trim().split(/\s+/);
				return [
					...acc,
					{
						bufferMemoryId: args[0],
						lineNumber: index,
						minValue: parseInt(args[1], 10) || -8,
						maxValue: parseInt(args[2], 10) || 8,
						bufferLengthMemoryId: args[3] || undefined,
					},
				];
			}

			return acc;
		},
		[] as Array<{
			bufferMemoryId: string;
			lineNumber: number;
			minValue: number;
			maxValue: number;
			bufferLengthMemoryId: string | undefined;
		}>
	);
}
