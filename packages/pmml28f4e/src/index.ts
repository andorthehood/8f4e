import { parsePmmlNeuralNetwork } from './pmml';
import { buildProjectFromNeuralNetwork } from './project';

import type { Project } from '@8f4e/editor-state';
import type { ConvertOptions } from './options';

export function convertPmmlNeuralNetworkToProject(pmmlXml: string, options: ConvertOptions = {}): Project {
	const neuralNetwork = parsePmmlNeuralNetwork(pmmlXml);
	return buildProjectFromNeuralNetwork(neuralNetwork, options);
}

export type { Project } from '@8f4e/editor-state';
export type { ConvertOptions } from './options';
