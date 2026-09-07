# Shared audio contexts for embedded editors

`mountDefaultEditor(canvas, { sharedAudioContext })` accepts an optional browser `AudioContext` owned by the host page.
The AudioWorklet runtime borrows it when its sample rate matches the project's `audioRuntime.sampleRate` (48 kHz by
default). A closed context or a different sample rate falls back to a context created and owned by that runtime.
Omitting the option preserves independent contexts and the existing Allow dialog.

The 8f4e website supplies one 48 kHz context per page. The first matching audio project's Allow button resumes it
directly during the user interaction. Later matching projects start automatically while the context is running,
including projects mounted after another editor has been disposed. Already mounted matching runtimes waiting for
permission also start when the shared context begins running. Sharing does not select or mute editors; hosts that
need exclusive playback should dispose the previous editor, as the examples gallery does.

Each editor retains its own worklet node, compiled program, and memory. The worklet module is loaded once per context
and URL. Disposing an editor stops its processor and microphone tracks and disconnects its nodes. It closes only a
context it created itself, leaving a borrowed context available for the next editor. The host should close the shared
context when it no longer needs it; the website closes it on development module disposal, and full page navigation
releases the document's context.

Projects requesting a different rate use their own context and Allow flow. Switching back to 48 kHz reuses the
shared context if it is still running. Sharing does not survive a full page navigation, grant microphone permission,
or prevent browser/device interruptions from suspending audio.
