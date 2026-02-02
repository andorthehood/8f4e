import { XMLParser } from 'fast-xml-parser';

export interface PmmlNeuralInput {
	id: number;
	fieldName: string;
}

export interface PmmlNeuralConnection {
	from: number;
	weight: number;
}

export interface PmmlNeuron {
	id: number;
	bias: number;
	activationFunction?: string;
	connections: PmmlNeuralConnection[];
}

export interface PmmlNeuralLayer {
	activationFunction?: string;
	neurons: PmmlNeuron[];
}

export interface PmmlNeuralOutput {
	outputNeuron: number;
	fieldName: string;
}

export interface PmmlNeuralNetwork {
	modelName?: string;
	activationFunction?: string;
	inputs: PmmlNeuralInput[];
	layers: PmmlNeuralLayer[];
	outputs: PmmlNeuralOutput[];
}

const parser = new XMLParser({
	ignoreAttributes: false,
	attributeNamePrefix: '',
	parseAttributeValue: true,
	parseTagValue: true,
	trimValues: true,
	ignoreDeclaration: true,
	ignorePiTags: true,
	removeNSPrefix: true,
});

function asRecordArray(value: unknown): Record<string, unknown>[] {
	if (!value) {
		return [];
	}
	if (Array.isArray(value)) {
		return value.filter((entry): entry is Record<string, unknown> => !!entry && typeof entry === 'object');
	}
	return typeof value === 'object' ? [value as Record<string, unknown>] : [];
}

function toNumber(value: unknown, label: string): number {
	if (typeof value === 'number' && !Number.isNaN(value)) {
		return value;
	}
	if (typeof value === 'string' && value.trim() !== '') {
		const parsed = Number(value);
		if (!Number.isNaN(parsed)) {
			return parsed;
		}
	}
	throw new Error(`Expected numeric ${label}, got ${JSON.stringify(value)}`);
}

function toStringValue(value: unknown, label: string): string {
	if (typeof value === 'string') {
		return value;
	}
	throw new Error(`Expected string ${label}, got ${JSON.stringify(value)}`);
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
	if (value && typeof value === 'object') {
		return value as Record<string, unknown>;
	}
	return undefined;
}

function findFirstTag(node: unknown, tagName: string): Record<string, unknown> | undefined {
	if (!node || typeof node !== 'object') {
		return undefined;
	}

	if (Array.isArray(node)) {
		for (const entry of node) {
			const found = findFirstTag(entry, tagName);
			if (found) {
				return found;
			}
		}
		return undefined;
	}

	const record = node as Record<string, unknown>;
	if (record[tagName] && typeof record[tagName] === 'object') {
		return record[tagName] as Record<string, unknown>;
	}

	for (const value of Object.values(record)) {
		const found = findFirstTag(value, tagName);
		if (found) {
			return found;
		}
	}

	return undefined;
}

export function parsePmmlNeuralNetwork(pmmlXml: string): PmmlNeuralNetwork {
	const doc = parser.parse(pmmlXml);
	const neuralNetworkNode = doc?.PMML?.NeuralNetwork ?? doc?.NeuralNetwork ?? findFirstTag(doc, 'NeuralNetwork');
	if (!neuralNetworkNode) {
		throw new Error('No <NeuralNetwork> tag found.');
	}
	const neuralNetwork = Array.isArray(neuralNetworkNode) ? neuralNetworkNode[0] : neuralNetworkNode;

	const inputs = asRecordArray(neuralNetwork?.NeuralInputs?.NeuralInput).map(input => {
		const id = toNumber(input.id, 'NeuralInput.id');
		const fieldRef = asRecord(asRecord(input.DerivedField)?.FieldRef);
		const fieldName = fieldRef?.field
			? toStringValue(fieldRef.field, 'NeuralInput.DerivedField.FieldRef.field')
			: `input${id}`;
		return { id, fieldName };
	});

	const layers = asRecordArray(neuralNetwork?.NeuralLayer).map(layer => {
		const neurons = asRecordArray(layer?.Neuron).map(neuron => {
			const id = toNumber(neuron.id, 'Neuron.id');
			const bias = neuron.bias === undefined ? 0 : toNumber(neuron.bias, 'Neuron.bias');
			const connections = asRecordArray(neuron?.Con).map(con => ({
				from: toNumber(con.from, 'Con.from'),
				weight: toNumber(con.weight, 'Con.weight'),
			}));
			return {
				id,
				bias,
				activationFunction: neuron.activationFunction ? String(neuron.activationFunction) : undefined,
				connections,
			};
		});

		return {
			activationFunction: layer.activationFunction ? String(layer.activationFunction) : undefined,
			neurons,
		};
	});

	const outputs = asRecordArray(neuralNetwork?.NeuralOutputs?.NeuralOutput).map((output, index) => {
		const outputNeuron = toNumber(output.outputNeuron, 'NeuralOutput.outputNeuron');
		const fieldRef = asRecord(asRecord(output.DerivedField)?.FieldRef);
		const fieldName = fieldRef?.field
			? toStringValue(fieldRef.field, 'NeuralOutput.DerivedField.FieldRef.field')
			: `output${index}`;
		return { outputNeuron, fieldName };
	});

	return {
		modelName: neuralNetwork.modelName ? String(neuralNetwork.modelName) : undefined,
		activationFunction: neuralNetwork.activationFunction ? String(neuralNetwork.activationFunction) : undefined,
		inputs,
		layers,
		outputs,
	};
}
