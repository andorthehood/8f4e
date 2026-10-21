# @8f4e/runtime-audio-worklet

AudioWorklet runtime for executing 8f4e programs in the browser audio graph. Includes the worklet entry point and runtime definition metadata.

## Responsibilities

- Provide the AudioWorklet processor entry.
- Expose runtime definitions used by the editor and host.

## Microphone input

When a project configures an audio input buffer, the runtime requests microphone audio with echo cancellation, noise
suppression, and automatic gain control disabled. This avoids voice-oriented processing that can attenuate or distort
music and feedback signals. Browsers and audio devices may still apply processing outside the Web Audio constraints.
