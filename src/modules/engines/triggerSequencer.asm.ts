import { I16_SIGNED_LARGEST_NUMBER } from '@8f4e/compiler';

export default ({ maxSteps = 16 }: { maxSteps?: number } = {}) => `
    private defaultValue 0
    inputPointer trigger defaultValue
    private triggerPreviousValue 0
    private stepMinusOne 0
    array steps ${maxSteps} 0
    private stepPointer stepMinusOne
    public stepLength 4
    private didTrigger 0
    output out 0

    local _stepPointer

    push stepPointer
    localSet _stepPointer

    push trigger
    push triggerPreviousValue
    greaterThan
    if void
        pushRef didTrigger
        push 0
        store

        push _stepPointer
        pointerForward
        localSet _stepPointer

        push _stepPointer
        push stepLength
        push 4
        mul
        pushRef steps
        add
        greaterOrEqual
        if void
            pushRef steps
            localSet _stepPointer
        end
    end
    pushRef stepPointer
    push _stepPointer
    store

    pushRef out
    push _stepPointer
    load
    push 0
    greaterThan
    if
        push didTrigger
        push 0
        greaterThan
        if
            push 0
        else
            pushRef didTrigger
            push 1
            store

            push ${I16_SIGNED_LARGEST_NUMBER}
        end
    else
        push 0
    end
    store

    pushRef triggerPreviousValue
    push trigger
    store
`;
