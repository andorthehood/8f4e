import type { CodeBlock, Project } from '@8f4e/editor-state';
import type { PmmlNeuralNetwork, PmmlNeuralLayer, PmmlNeuron } from './pmml';

const DEFAULT_GRID_SPACING_X = 40;
const DEFAULT_BLOCK_PADDING_Y = 2;
const MAX_ROWS_PER_LAYER = 6;
const LAYER_GAP_COLUMNS = 1;

function sanitizeIdentifier(value: string): string {
	const sanitized = value.replace(/[^a-zA-Z0-9_]/g, '_');
	return /^[a-zA-Z_]/.test(sanitized) ? sanitized : `_${sanitized}`;
}

function formatFloat(value: number): string {
	return Number.isInteger(value) ? `${value}.0` : String(value);
}

function normalizeActivation(value: string | undefined): string | undefined {
	return value ? value.trim().toLowerCase() : undefined;
}

function getActivationForNeuron(
	neuron: PmmlNeuron,
	layer: PmmlNeuralLayer,
	networkActivation: string | undefined
): string | undefined {
	return (
		normalizeActivation(neuron.activationFunction) ??
		normalizeActivation(layer.activationFunction) ??
		normalizeActivation(networkActivation)
	);
}

function buildSigmoidFunctionBlock(): CodeBlock {
	return {
		code: [
			'function sigmoid',
			'; @pos -12 -6',
			'param float x',
			'; Fast sigmoid approximation: x / (1 + |x|)',
			'',
			'localGet x',
			'dup',
			'abs',
			'push 1.0',
			'add',
			'ensureNonZero',
			'div',
			'',
			'functionEnd float',
		],
	};
}

function buildInputsBlock(inputs: PmmlNeuralNetwork['inputs']): CodeBlock {
	const code: string[] = ['module inputs', '; @pos -32 0', '; Input layer', '; PMML inputs', ''];
	inputs.forEach(input => {
		const name = sanitizeIdentifier(input.fieldName);
		code.push(`float ${name} 0.0`);
	});
	code.push('', 'moduleEnd');
	return {
		code,
	};
}

function buildNeuronCode(
	neuron: PmmlNeuron,
	activation: string | undefined,
	connections: Array<{ address: string; index: number; weight: number }>,
	layerIndex: number,
	layerType: string
): string[] {
	const code: string[] = [`module neuron${neuron.id}`, `; ${layerType} layer ${layerIndex + 1}`, ''];
	connections.forEach(connection => {
		code.push(`float* in${connection.index} ${connection.address}`);
	});
	code.push('float out', '', '; Weights');

	connections.forEach(connection => {
		code.push(`const W${connection.index} ${formatFloat(connection.weight)}`);
	});
	code.push(`const BIAS ${formatFloat(neuron.bias)}`, '', 'push &out', 'push BIAS');

	connections.forEach(connection => {
		code.push(`push *in${connection.index}`);
		code.push(`push W${connection.index}`);
		code.push('mul');
		code.push('add');
	});

	if (activation === 'logistic' || activation === 'sigmoid') {
		code.push('call sigmoid');
	} else if (activation && activation !== 'identity' && activation !== 'linear') {
		throw new Error(`Unsupported activation function: ${activation}`);
	}

	code.push('store', '', 'moduleEnd');
	return code;
}

function buildNeuronBlock(code: string[], position: { x: number; y: number }): CodeBlock {
	// Insert @pos directive as second line
	code.splice(1, 0, `; @pos ${position.x} ${position.y}`);
	return {
		code,
	};
}

function buildOutputsBlock(outputs: PmmlNeuralNetwork['outputs'], position: { x: number; y: number }): CodeBlock {
	const code: string[] = [
		'module outputs',
		`; @pos ${position.x} ${position.y}`,
		'; Output layer',
		'; PMML outputs',
		'',
	];
	outputs.forEach((output, index) => {
		const name = sanitizeIdentifier(output.fieldName || `output${index}`);
		code.push(`float* in${index} &neuron${output.outputNeuron}.out`);
		code.push(`float ${name}`);
		code.push(`push &${name}`);
		code.push(`push *in${index}`);
		code.push('store', '');
	});
	code.push('moduleEnd');
	return {
		code,
	};
}

export function buildProjectFromNeuralNetwork(neuralNetwork: PmmlNeuralNetwork): Project {
	const codeBlocks: CodeBlock[] = [];
	const activationNeeded = [
		neuralNetwork.activationFunction,
		...neuralNetwork.layers.map(layer => layer.activationFunction),
		...neuralNetwork.layers.flatMap(layer => layer.neurons.map(neuron => neuron.activationFunction)),
	]
		.filter(Boolean)
		.map(value => normalizeActivation(String(value)))
		.some(value => value === 'logistic' || value === 'sigmoid');

	if (activationNeeded) {
		codeBlocks.push(buildSigmoidFunctionBlock());
	}

	codeBlocks.push(buildInputsBlock(neuralNetwork.inputs));

	const addressById = new Map<number, string>();
	neuralNetwork.inputs.forEach(input => {
		const name = sanitizeIdentifier(input.fieldName);
		addressById.set(input.id, `&inputs.${name}`);
	});

	let layerBaseX = 0;
	neuralNetwork.layers.forEach((layer, layerIndex) => {
		const activationByIndex = layer.neurons.map(neuron =>
			getActivationForNeuron(neuron, layer, neuralNetwork.activationFunction)
		);
		const layerType = layerIndex === neuralNetwork.layers.length - 1 ? 'Output' : 'Hidden';
		const neuronCodes = layer.neurons.map((neuron, index) =>
			buildNeuronCode(
				neuron,
				activationByIndex[index],
				neuron.connections.map((connection, connectionIndex) => {
					const address = addressById.get(connection.from);
					if (!address) {
						throw new Error(`Unknown connection source id ${connection.from} for neuron ${neuron.id}`);
					}
					return { address, index: connectionIndex, weight: connection.weight };
				}),
				layerIndex,
				layerType
			)
		);
		const heights = neuronCodes.map(code => Math.max(1, code.length));
		const columns = Math.max(1, Math.ceil(layer.neurons.length / MAX_ROWS_PER_LAYER));

		for (let columnIndex = 0; columnIndex < columns; columnIndex += 1) {
			const start = columnIndex * MAX_ROWS_PER_LAYER;
			const end = Math.min(start + MAX_ROWS_PER_LAYER, layer.neurons.length);
			const columnHeights = heights.slice(start, end);
			const totalHeight =
				columnHeights.reduce((sum, height) => sum + height, 0) +
				DEFAULT_BLOCK_PADDING_Y * Math.max(0, columnHeights.length - 1);
			let cursorY = Math.round(totalHeight / 2);

			for (let localIndex = 0; localIndex < columnHeights.length; localIndex += 1) {
				const neuronIndex = start + localIndex;
				const neuron = layer.neurons[neuronIndex];
				const code = neuronCodes[neuronIndex];

				const position = {
					x: layerBaseX + columnIndex * DEFAULT_GRID_SPACING_X,
					y: cursorY,
				};

				codeBlocks.push(buildNeuronBlock(code, position));
				addressById.set(neuron.id, `&neuron${neuron.id}.out`);
				cursorY -= columnHeights[localIndex] + DEFAULT_BLOCK_PADDING_Y;
			}
		}

		layerBaseX += (columns + LAYER_GAP_COLUMNS) * DEFAULT_GRID_SPACING_X;
	});

	if (neuralNetwork.outputs.length > 0) {
		const outputBlock = buildOutputsBlock(neuralNetwork.outputs, {
			x: layerBaseX + DEFAULT_GRID_SPACING_X,
			y: 0,
		});
		codeBlocks.push(outputBlock);
	}

	return {
		codeBlocks,
		viewport: {
			gridCoordinates: { x: 0, y: 0 },
		},
	};
}
