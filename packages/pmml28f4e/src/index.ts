import { parsePmmlNeuralNetwork } from './pmml';
import { buildProjectFromNeuralNetwork } from './project';

import type { Project } from '@8f4e/editor-state';

export function convertPmmlNeuralNetworkToProject(pmmlXml: string): Project {
	const neuralNetwork = parsePmmlNeuralNetwork(pmmlXml);
	return buildProjectFromNeuralNetwork(neuralNetwork);
}

export type { Project } from '@8f4e/editor-state';
