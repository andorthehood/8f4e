import assert from 'node:assert/strict';
import { cpus } from 'node:os';
import { resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { pathToFileURL } from 'node:url';

// Pass a built entry point to compare the same workload against a saved baseline.
const entry = pathToFileURL(
	resolve(process.argv[2] ?? 'packages/editor/packages/editor-core/packages/state-manager/dist/index.js')
);
const { default: createStateManager } = await import(entry.href);
const warmup = 10_000;
const updates = 20_000;
const samples = 7;
const results = [];

for (const mode of ['leaf update', 'parent replacement']) {
	for (const groups of [1, 8, 32]) {
		const trees = [0, 1].map(value => ({ branch: { node: { leaf: { value } } } }));
		const manager = createStateManager({ tree: trees[0], unrelated: 0 });
		let callbacks = 0;
		const callback = () => callbacks++;
		for (let i = 0; i < groups; i++) {
			manager.subscribe('tree', callback);
			manager.subscribe('tree.branch.node', callback);
			manager.subscribe('tree.branch.node.leaf.value', callback);
			manager.subscribeToValue('tree.branch.node.leaf.value', 1, callback);
			manager.subscribeToValue('tree.branch.node.leaf.value', value => value === 1, callback);
		}
		for (let i = 0; i < 16; i++) manager.subscribe('unrelated', callback);

		const run = count => {
			callbacks = 0;
			const start = performance.now();
			if (mode === 'leaf update') {
				for (let i = 0; i < count; i++) manager.set('tree.branch.node.leaf.value', i & 1);
			} else {
				for (let i = 0; i < count; i++) manager.set('tree', trees[i & 1]);
			}
			const elapsed = performance.now() - start;
			assert.equal(callbacks, count * groups * 4);
			assert.equal(manager.getState().tree.branch.node.leaf.value, 1);
			return elapsed;
		};

		run(warmup);
		const milliseconds = Array.from({ length: samples }, () => run(updates));
		const sorted = [...milliseconds].sort((a, b) => a - b);
		results.push({
			mode,
			matchingSubscriptions: groups * 5,
			unrelatedSubscriptions: 16,
			callbacksPerSample: updates * groups * 4,
			milliseconds,
			medianMs: sorted[Math.floor(samples / 2)],
		});
		manager.dispose();
	}
}

console.log(
	JSON.stringify(
		{
			node: process.version,
			platform: process.platform,
			arch: process.arch,
			cpu: cpus()[0].model,
			warmup,
			updates,
			samples,
			results,
		},
		null,
		2
	)
);
