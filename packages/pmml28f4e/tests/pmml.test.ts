import { describe, it, expect } from 'vitest';
import { serializeProjectTo8f4e } from '@8f4e/editor-state';

import { convertPmmlNeuralNetworkToProject } from '../src/index';

const samplePmml = `
<PMML version="4.4" xmlns="http://www.dmg.org/PMML-4_4">
  <NeuralNetwork modelName="Tiny" activationFunction="logistic">
    <NeuralInputs numberOfInputs="2">
      <NeuralInput id="0"><DerivedField><FieldRef field="input0"/></DerivedField></NeuralInput>
      <NeuralInput id="1"><DerivedField><FieldRef field="input1"/></DerivedField></NeuralInput>
    </NeuralInputs>
    <NeuralLayer numberOfNeurons="1" activationFunction="logistic">
      <Neuron id="2" bias="0.5">
        <Con from="0" weight="1.5"/>
        <Con from="1" weight="-2.0"/>
      </Neuron>
    </NeuralLayer>
    <NeuralOutputs numberOfOutputs="1">
      <NeuralOutput outputNeuron="2"><DerivedField><FieldRef field="output0"/></DerivedField></NeuralOutput>
    </NeuralOutputs>
  </NeuralNetwork>
</PMML>
`;

describe('convertPmmlNeuralNetworkToProject', () => {
	it('creates code blocks for inputs, neuron, outputs, and sigmoid', () => {
		const project = convertPmmlNeuralNetworkToProject(samplePmml);
		expect(serializeProjectTo8f4e(project)).toMatchSnapshot();
	});
});
