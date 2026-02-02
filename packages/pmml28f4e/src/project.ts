import type { CodeBlock, Project } from '@8f4e/editor-state';
import type { PmmlNeuralNetwork, PmmlNeuralLayer, PmmlNeuron } from './pmml';
import type { ConvertOptions } from './options';

const DEFAULT_GRID_SPACING_X = 36;
const DEFAULT_GRID_SPACING_Y = 8;

function sanitizeIdentifier(value: string): string {
	const sanitized = value.replace(/[^a-zA-Z0-9_]/g, '_');
	return /^[a-zA-Z_]/.test(sanitized) ? sanitized : `_${sanitized}`;
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

function buildConfigBlock(modelName?: string): CodeBlock {
	const titleLine = modelName ? `; PMML Model: ${modelName}` : '; PMML Model';
	return {
		code: ['config project', titleLine, 'configEnd'],
		gridCoordinates: { x: -12, y: 6 },
	};
}

function buildSigmoidFunctionBlock(): CodeBlock {
	return {
		code: [
			'function sigmoid',
			'param float x',
			'; Polynomial sigmoid approximation',
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
		gridCoordinates: { x: -12, y: -6 },
	};
}

function buildInputsBlock(inputs: PmmlNeuralNetwork['inputs']): CodeBlock {
	const code: string[] = ['module inputs', '; PMML inputs', ''];
	inputs.forEach(input => {
		const name = sanitizeIdentifier(input.fieldName);
		code.push(`float ${name} 0.0`);
	});
	code.push('', 'moduleEnd');
	return {
		code,
		gridCoordinates: { x: -DEFAULT_GRID_SPACING_X, y: 0 },
	};
}

function buildNeuronBlock(
	neuron: PmmlNeuron,
	activation: string | undefined,
	connections: Array<{ address: string; index: number; weight: number }>,
	position: { x: number; y: number }
): CodeBlock {
	const code: string[] = [`module neuron_${neuron.id}`, '', '; Inputs'];
	connections.forEach(connection => {
		code.push(`float* in${connection.index} ${connection.address}`);
	});
	code.push('float out', '', '; Weights');

	connections.forEach(connection => {
		code.push(`const W${connection.index} ${connection.weight}`);
	});
	code.push(`const BIAS ${neuron.bias}`, '', 'push &out', 'push BIAS');

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

	return {
		code,
		gridCoordinates: position,
	};
}

function buildOutputsBlock(outputs: PmmlNeuralNetwork['outputs']): CodeBlock {
	const code: string[] = ['module outputs', '; PMML outputs', ''];
	outputs.forEach((output, index) => {
		const name = sanitizeIdentifier(output.fieldName || `output${index}`);
		code.push(`float* in${index} &neuron_${output.outputNeuron}.out`);
		code.push(`float ${name}`);
		code.push(`push &${name}`);
		code.push(`push *in${index}`);
		code.push('store', '');
	});
	code.push('moduleEnd');
	return {
		code,
		gridCoordinates: { x: DEFAULT_GRID_SPACING_X, y: 0 },
	};
}

export function buildProjectFromNeuralNetwork(neuralNetwork: PmmlNeuralNetwork, options: ConvertOptions): Project {
	const codeBlocks: CodeBlock[] = [];
	const activationNeeded = [
		neuralNetwork.activationFunction,
		...neuralNetwork.layers.map(layer => layer.activationFunction),
		...neuralNetwork.layers.flatMap(layer => layer.neurons.map(neuron => neuron.activationFunction)),
	]
		.filter(Boolean)
		.map(value => normalizeActivation(String(value)))
		.some(value => value === 'logistic' || value === 'sigmoid');

	codeBlocks.push(buildConfigBlock(options.projectName ?? neuralNetwork.modelName));
	if (activationNeeded) {
		codeBlocks.push(buildSigmoidFunctionBlock());
	}

	codeBlocks.push(buildInputsBlock(neuralNetwork.inputs));

	const addressById = new Map<number, string>();
	neuralNetwork.inputs.forEach(input => {
		const name = sanitizeIdentifier(input.fieldName);
		addressById.set(input.id, `&inputs.${name}`);
	});

	neuralNetwork.layers.forEach((layer, layerIndex) => {
		layer.neurons.forEach((neuron, neuronIndex) => {
			const activation = getActivationForNeuron(neuron, layer, neuralNetwork.activationFunction);
			const connections = neuron.connections.map((connection, index) => {
				const address = addressById.get(connection.from);
				if (!address) {
					throw new Error(`Unknown connection source id ${connection.from} for neuron ${neuron.id}`);
				}
				return { address, index, weight: connection.weight };
			});

			const position = {
				x: layerIndex * DEFAULT_GRID_SPACING_X,
				y: -neuronIndex * DEFAULT_GRID_SPACING_Y,
			};

			codeBlocks.push(buildNeuronBlock(neuron, activation, connections, position));
			addressById.set(neuron.id, `&neuron_${neuron.id}.out`);
		});
	});

	if (neuralNetwork.outputs.length > 0) {
		const outputBlock = buildOutputsBlock(neuralNetwork.outputs);
		outputBlock.gridCoordinates = {
			x: neuralNetwork.layers.length * DEFAULT_GRID_SPACING_X + DEFAULT_GRID_SPACING_X,
			y: 0,
		};
		codeBlocks.push(outputBlock);
	}

	return {
		codeBlocks,
		viewport: {
			gridCoordinates: { x: 0, y: 0 },
		},
	};
}
