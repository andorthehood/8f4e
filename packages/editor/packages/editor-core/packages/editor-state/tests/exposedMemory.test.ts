import { readFileSync } from 'node:fs';
import { compileProject, parseProjectSource } from '@8f4e/compiler';
import type { CodeBlockGraphicData } from '@8f4e/editor-state-types';
import { createChildProjectGroupPath, type ProjectObjectModel } from '@8f4e/language-spec';
import createStateManager from '@8f4e/state-manager';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import button from '~/features/code-blocks/features/directives/button/interaction';
import crossfade from '~/features/code-blocks/features/directives/crossfade/interaction';
import {
	deriveDirectiveState,
	runAfterGraphicDataWidthCalculation,
	runBeforeGraphicDataWidthCalculation,
} from '~/features/code-blocks/features/directives/registry';
import slider from '~/features/code-blocks/features/directives/slider/interaction';
import updateInputs from '~/features/code-blocks/features/inputs/updateGraphicData';
import updateOutputs from '~/features/code-blocks/features/outputs/updateGraphicData';
import saveDefaults from '~/features/code-blocks/features/sliderDefaultSaver/effect';
import { getControlDefaultEdits } from '~/features/code-blocks/features/sliderDefaultSaver/saveDefaults';
import resolveMemoryIdentifier from '~/pureHelpers/resolveMemoryIdentifier';
import resolveMemoryTarget from '~/pureHelpers/resolveMemoryTarget';
import { createMockCodeBlock, createMockState } from '~/pureHelpers/testingUtils/testUtils';
import { createMockEventDispatcherWithVitest } from '~/pureHelpers/testingUtils/vitestTestUtils';

const source = readFileSync(new URL('./fixtures/exposed-controls.8f4e', import.meta.url), 'utf8');

function createBlocks(project: ProjectObjectModel, projectPath = ''): CodeBlockGraphicData[] {
	return [
		...project.modules.map(block => createMockCodeBlock({ code: block.code, projectPath, blockType: 'module' })),
		...project.groups.map(group =>
			createMockCodeBlock({
				name: group.name,
				code: group.code,
				projectPath,
				nestedProjectCodeBlocks: createBlocks(group, createChildProjectGroupPath(projectPath, group.name)),
			})
		),
	];
}

async function setup() {
	const project = parseProjectSource(source);
	const compiled = await compileProject(project, { disableSharedMemory: true });
	const state = createMockState();
	state.compiler.memoryPlan = compiled.memoryPlan;
	state.compiler.projectMemoryExposuresByGroupPath = compiled.projectMemoryExposuresByGroupPath;
	state.compiler.pointerMetadataByModuleId = compiled.pointerMetadataByModuleId;
	const memory = new WebAssembly.Memory({ initial: 1, maximum: 1 });
	const { instance } = await WebAssembly.instantiate(new Uint8Array(compiled.codeBuffer), { host: { memory } });
	(instance.exports.initDefaults as CallableFunction)();
	const int32 = new Int32Array(memory.buffer);
	const float32 = new Float32Array(memory.buffer);
	state.callbacks.getWordFromMemory = address => int32[address];
	state.callbacks.setWordInMemory = (address, value, isInteger) => {
		if (isInteger) int32[address] = value;
		else float32[address] = value;
	};
	state.codeBlockRendering.rootCodeBlocks = createBlocks(project);
	state.codeBlockRendering.codeBlocks = state.codeBlockRendering.rootCodeBlocks;
	const audio = state.codeBlockRendering.rootCodeBlocks.find(block => block.name === 'audio')!;
	const controls = state.codeBlockRendering.rootCodeBlocks.find(block => block.name === 'controls')!;
	const voice = audio.nestedProjectCodeBlocks!.find(block => block.name === 'voice')!;
	const store = createStateManager(state);
	const events = createMockEventDispatcherWithVitest();
	events.dispatch = (name, payload) => {
		for (const [eventName, handler] of vi.mocked(events.on).mock.calls) {
			if (eventName === name) handler(payload);
		}
	};
	const derive = (block: CodeBlockGraphicData) => {
		const directives = deriveDirectiveState(block.code, block.parsedDirectives);
		runBeforeGraphicDataWidthCalculation(block, state, directives);
		runAfterGraphicDataWidthCalculation(block, state, directives);
	};
	derive(audio);
	derive(controls);
	return { state, audio, controls, voice, store, events, int32, float32, derive };
}

describe('shared exposed memory resolution', () => {
	let test: Awaited<ReturnType<typeof setup>>;
	beforeEach(async () => {
		test = await setup();
	});
	afterEach(() => test?.store.dispose());

	it('preserves public identity and resolves local, external, and direct references to the same storage', () => {
		const { state, audio, controls } = test;
		const local = resolveMemoryTarget(state, audio, 'gain')!;
		expect(local).toMatchObject({
			publicModuleId: 'audio',
			publicName: 'gain',
			moduleId: 'audio/voice',
			exposure: { type: 'int' },
		});
		expect(local.memory.isInteger).toBe(false);
		expect(resolveMemoryTarget(state, controls, 'audio:gain')?.memory).toBe(local.memory);
		expect(resolveMemoryTarget(state, '', 'audio/voice:level')?.memory).toBe(local.memory);
		expect(resolveMemoryIdentifier(state, audio, '&gain')?.memory).toBe(local.memory);
		const directMemory = state.compiler.memoryPlan.modules.controls.memory.level;
		state.compiler.memoryPlan.modules.audio = {
			...state.compiler.memoryPlan.modules.controls,
			id: 'audio',
			memory: { gain: directMemory },
		};
		expect(resolveMemoryTarget(state, controls, 'audio:gain')?.memory).toBe(local.memory);
		expect(resolveMemoryTarget(state, audio, 'gain')?.memory).toBe(local.memory);
		expect(resolveMemoryTarget(state, 'audio', 'gain')?.memory).toBe(directMemory);
	});

	it('resolves nested and sibling namespaces without searching unrelated scopes', () => {
		const { state, audio } = test;
		const nested = audio.nestedProjectCodeBlocks!.find(block => block.name === 'nested')!;
		expect(resolveMemoryTarget(state, audio, 'nested:gain')?.moduleId).toBe('audio/nested/voice');
		expect(resolveMemoryTarget(state, nested, 'gain')?.moduleId).toBe('audio/nested/voice');
		expect(resolveMemoryTarget(state, '', 'audio/nested:gain')?.memory.isInteger).toBe(true);
		expect(resolveMemoryTarget(state, '', 'other:gain')?.moduleId).toBe('other/voice');
		expect(resolveMemoryTarget(state, nested, 'wet')).toBeUndefined();
	});

	it('uses canonical pointer metadata when dereferencing an exposed pointer', () => {
		const { state, audio } = test;
		const target = resolveMemoryTarget(state, audio, 'gain')!.memory;
		expect(resolveMemoryIdentifier(state, audio, '*input')?.memory).toBe(target);
		state.compiler.pointerMetadataByModuleId['audio/voice'].pointer.pointeeMemoryIndex = 1;
		const alternate = { ...target, id: 'otherMemory', memoryIndex: 1 };
		state.compiler.memoryPlan.moduleList.push({
			...state.compiler.memoryPlan.modules['audio/voice'],
			memoryIndex: 1,
			declarations: [alternate],
		});
		expect(resolveMemoryIdentifier(state, audio, '*input')?.memory).toBe(alternate);
	});

	it('shares backing addresses and preserves public connector direction despite differing public types', () => {
		const { state, audio, derive } = test;
		const bare = createMockCodeBlock({
			name: 'audio',
			code: ['group audio', '; @slider &gain', 'groupEnd'],
			nestedProjectCodeBlocks: audio.nestedProjectCodeBlocks,
		});
		derive(bare);
		expect(bare.widgets.sliders[0]).toMatchObject({ min: 0, max: 1, isInteger: false });
		updateInputs(audio, state);
		updateOutputs(audio, state);
		const gain = audio.widgets.sliders[0];
		expect(gain).toMatchObject({ moduleId: 'audio/voice', id: 'level', isInteger: false });
		expect(audio.widgets.debuggers[0].memory?.wordAlignedAddress).toBe(gain.wordAlignedAddress);
		expect(audio.widgets.outputs.find(output => output.id === 'gain')?.memory.wordAlignedAddress).toBe(
			gain.wordAlignedAddress
		);
		expect(audio.widgets.inputs.map(input => input.id)).toEqual(['gateInput', 'input']);
		expect(audio.widgets.arrayPlotters[0].length).toBe(4);
		expect(audio.widgets.arrayBars[0].length).toBe(4);
		expect(audio.widgets.arrayWaves[0].length).toBe(4);
		expect(audio.widgets.arrayMeters[0].memory.memory.wordAlignedAddress).toBe(gain.wordAlignedAddress);
		expect(audio.widgets.switches[0].wordAlignedAddress).toBe(audio.widgets.buttons[0].wordAlignedAddress);
		expect(audio.widgets.pianoKeyboards[0]).toMatchObject({
			pressedKeysListModuleId: 'audio/notesData',
			pressedNumberOfKeysModuleId: 'audio/countData',
		});
	});

	it('writes slider, button, and crossfade values to the resolved backing memory', () => {
		const { state, audio, store, events, float32, int32 } = test;
		const cleanupSlider = slider(store, events);
		const sliderWidget = audio.widgets.sliders[0];
		events.dispatch('codeBlockClick', {
			codeBlock: audio,
			x: audio.x + sliderWidget.x + sliderWidget.width / 2,
			y: audio.y + sliderWidget.y + 1,
		});
		expect(float32[sliderWidget.wordAlignedAddress]).toBeCloseTo(0.5);
		cleanupSlider();
		const cleanupButton = button(state, events);
		const buttonWidget = audio.widgets.buttons[0];
		events.dispatch('codeBlockClick', {
			codeBlock: audio,
			x: audio.x + buttonWidget.x + 1,
			y: audio.y + buttonWidget.y + 1,
		});
		expect(int32[buttonWidget.wordAlignedAddress]).toBe(1);
		events.dispatch('mouseup');
		expect(int32[buttonWidget.wordAlignedAddress]).toBe(0);
		cleanupButton();
		const cleanupCrossfade = crossfade(store, events);
		const widget = audio.widgets.crossfades[0];
		events.dispatch('codeBlockClick', {
			codeBlock: audio,
			x: audio.x + widget.x + widget.handleWidth / 2,
			y: audio.y + widget.y + 1,
		});
		expect(float32[widget.leftWordAddress]).toBe(1);
		expect(float32[widget.rightWordAddress]).toBe(0);
		cleanupCrossfade();
	});

	it('saves group controls into their distinct backing modules and preserves interface and unrelated declarations', () => {
		const { state, audio, voice, controls, store, events, float32, int32 } = test;
		audio.nestedProjectCodeBlocks!.push(
			createMockCodeBlock({
				name: 'voice',
				projectPath: 'audio',
				blockType: 'function',
				code: ['function voice', 'functionEnd'],
			})
		);
		const originalGroup = [...audio.code];
		const originalControls = [...controls.code];
		float32[audio.widgets.sliders[0].wordAlignedAddress] = 0.8;
		const piano = audio.widgets.pianoKeyboards[0];
		int32[piano.pressedKeysListMemory.wordAlignedAddress] = 50;
		int32[piano.pressedKeysListMemory.wordAlignedAddress + 1] = 52;
		int32[piano.pressedNumberOfKeysMemory.wordAlignedAddress] = 2;
		saveDefaults(store, events);
		events.dispatch('saveSliderValuesToCode', { codeBlock: audio });
		expect(voice.code).toContain('float level 0.8');
		expect(audio.nestedProjectCodeBlocks!.find(block => block.name === 'notesData')!.code).toContain(
			'int[] notes 4 50 52'
		);
		expect(audio.nestedProjectCodeBlocks!.find(block => block.name === 'countData')!.code).toContain('int count 2');
		expect(audio.code).toEqual(originalGroup);
		expect(controls.code).toEqual(originalControls);
		expect(state.compilerInputRevision).toBe(1);
		events.dispatch('saveSliderValuesToCode', { codeBlock: controls });
		expect(state.compilerInputRevision).toBe(1);
		float32[audio.widgets.sliders[0].wordAlignedAddress] = 0.6;
		events.dispatch('saveSliderValuesToCode', { codeBlock: controls });
		expect(voice.code).toContain('float level 0.6');
		expect(controls.code).toEqual(originalControls);
		expect(state.compilerInputRevision).toBe(2);
		expect(getControlDefaultEdits(state, audio)).toEqual([]);
		store.dispose();
	});

	it('rebinds controls to replacement metadata and removes unresolved aliases', () => {
		const { state, audio, derive } = test;
		const replacement = {
			...state.compiler.projectMemoryExposuresByGroupPath.audio[0],
			targetModuleId: 'other/voice',
			targetMemory: state.compiler.memoryPlan.modules['other/voice'].memory.level,
		};
		state.compiler.projectMemoryExposuresByGroupPath = { audio: [replacement] };
		derive(audio);
		expect(audio.widgets.sliders[0].moduleId).toBe('other/voice');
		expect(audio.widgets.sliders[0].wordAlignedAddress).toBe(replacement.targetMemory.wordAlignedAddress);
		state.compiler.projectMemoryExposuresByGroupPath = {};
		derive(audio);
		expect(audio.widgets.sliders).toEqual([]);
		expect(audio.widgets.debuggers).toEqual([]);
		expect(resolveMemoryTarget(state, '', 'audio:gain')).toBeUndefined();
	});
});
