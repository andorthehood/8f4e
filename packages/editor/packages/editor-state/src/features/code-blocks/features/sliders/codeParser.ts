export default function parseSliders(code: string[]) {
	return code.reduce(
		(acc, line, index) => {
			// Match semicolon comment lines with @slider directive
			const commentMatch = line.match(/^\s*;\s*@(\w+)\s+(.*)/);
			if (commentMatch && commentMatch[1] === 'slider') {
				const args = commentMatch[2].trim().split(/\s+/);
				const parsedMin = args[1] !== undefined ? parseFloat(args[1]) : undefined;
				const parsedMax = args[2] !== undefined ? parseFloat(args[2]) : undefined;
				const parsedStep = args[3] !== undefined ? parseFloat(args[3]) : undefined;

				return [
					...acc,
					{
						id: args[0],
						lineNumber: index,
						min: parsedMin !== undefined && !isNaN(parsedMin) ? parsedMin : undefined,
						max: parsedMax !== undefined && !isNaN(parsedMax) ? parsedMax : undefined,
						step: parsedStep !== undefined && !isNaN(parsedStep) ? parsedStep : undefined,
					},
				];
			}
			return acc;
		},
		[] as Array<{
			id: string;
			lineNumber: number;
			min: number | undefined;
			max: number | undefined;
			step: number | undefined;
		}>
	);
}
