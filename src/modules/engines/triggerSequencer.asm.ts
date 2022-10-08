import { WORD_LENGTH } from '@8f4e/compiler/dist/consts';

import { I16_SIGNED_LARGEST_NUMBER } from './consts';
import { ModuleStateExtractor, ModuleStateInserter } from './types';

interface State {
	rate: number;
}

export const insertState: ModuleStateInserter<State> = function (state, memoryBuffer, moduleAddress) {
	memoryBuffer[moduleAddress + 1] = state.rate;
};

export const extractState: ModuleStateExtractor<State> = function (memoryBuffer, moduleAddress) {
	return { rate: memoryBuffer[moduleAddress + 1] };
};

export default ({ maxSteps = 16 }: { maxSteps?: number } = {}) => `
    private stepPointer 0
    private defaultValue 0
    inputPointer trigger defaultValue
    private triggerPreviousValue 0
    array steps ${maxSteps} 0
    public stepArraySize ${WORD_LENGTH * 4}
    output out 0

    local _stepPointer

    push stepPointer
    localSet _stepPointer

    push trigger
    push triggerPreviousValue
    greaterThan
    if void
        push _stepPointer
        push ${WORD_LENGTH}
        add
        localSet _stepPointer
    end
    pushRef stepPointer
    push _stepPointer
    store

    pushRef out
    pushRef steps
    push _stepPointer
    add
    load
    store

    pushRef triggerPreviousValue
    push trigger
    store
`;
