# @8f4e/pmml28f4e

Convert PMML (Predictive Model Markup Language) neural network definitions (NeuralNetwork + layers/neurons/weights) into runnable 8f4e projects, producing code blocks that mirror the network structure for use inside the 8f4e editor/runtime.

## Install

This package is part of the 8f4e monorepo. Build with Nx:

```
npx nx run @8f4e/pmml28f4e:build
```

## CLI

```
pmml28f4e <input.pmml> [--out project.json] [--pretty] [--name "Project Name"]
```

## API

```ts
import { convertPmmlNeuralNetworkToProject } from '@8f4e/pmml28f4e';

const project = convertPmmlNeuralNetworkToProject(pmmlXml, { projectName: 'MyModel' });
```

## Supported PMML

- `<NeuralNetwork>` with `<NeuralInputs>`, `<NeuralLayer>` / `<Neuron>` / `<Con>`, and `<NeuralOutputs>`.
- Activation functions: `logistic` / `sigmoid` (mapped to the built-in sigmoid function).
- Other activation functions will throw.

## Limitations

- Feed-forward networks only (no recurrent connections).
- No support for PMML normalization/derived-field transformations beyond basic `FieldRef` naming.
- Only a single `<NeuralNetwork>` is converted; other PMML model types are ignored.
- Output post-processing (e.g., softmax) is not generated.

## Output Structure

The generated project includes:
- A `config project` block with the model name.
- A `function sigmoid` helper (when needed).
- An `inputs` module with input fields.
- One module per neuron (`module neuron_<id>`).
- An `outputs` module that maps output neurons to named fields.
