export default ({ maxSteps = 16 }: { maxSteps?: number } = {}) => `
    private defaultValue 0
    inputPointer trigger defaultValue
    private triggerPreviousValue 0
    array steps ${maxSteps} 0
    private stepPointer steps
    public stepLength 4
    output out 0

    local _stepPointer

    push stepPointer
    localSet _stepPointer

    push trigger
    push triggerPreviousValue
    greaterThan
    if void
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
    store

    pushRef triggerPreviousValue
    push trigger
    store
`;
