export interface Config {
	numberOfPorts?: number;
	numberOfDataPlaceholders?: number;
}

export default ({ numberOfPorts = 1, numberOfDataPlaceholders = 1 }) => {
	const ports = new Array(numberOfPorts).fill(0).map((item, index) => index + 1);
	const dataPlaceholders = new Array(numberOfDataPlaceholders).fill(0).map((item, index) => index + 1);

	return `module buffer

private defaultValue 0
public numberOfInputs ${numberOfPorts}
public numberOfOutputs ${numberOfPorts}
public numberOfDataPlaceholders ${numberOfDataPlaceholders}

${ports.map(index => `inputPointer in:${index} &defaultValue`).join('\n')}
${ports.map(index => `output out:${index} 0`).join('\n')}

${dataPlaceholders.map(index => `public data:${index} 0`).join('\n')}

${ports
	.map(
		index => `push &out:${index}
push in:${index}
store
`
	)
	.join('\n')}`;
};
