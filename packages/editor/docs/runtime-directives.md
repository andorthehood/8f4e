# Runtime Directives

Runtime directives configure project-level runtime behaviour from within source code. They use the `~` prefix to distinguish them from editor directives.

## Directive Syntax

```txt
; ~<name> <args...>
```

Runtime directives are valid in **any code block type** (module, function, constants, config, etc.) and always apply project-globally regardless of where they appear.

## Supported Runtime Directives

### `~sampleRate`

Set the project sample rate used for generated environment constants.

```txt
; ~sampleRate <value>
```

- `value` must be a positive number (e.g. `44100`, `48000`, `50`)
- Duplicate declarations with the same value are allowed
- Declarations with conflicting values produce a compile error
- The resolved value drives the `SAMPLE_RATE` and `INV_SAMPLE_RATE` constants in the auto-managed `env` constants block

**Example**:

```txt
; ~sampleRate 44100
```

This replaces the legacy stack-config `scope "runtimeSettings" / scope "sampleRate" / set 44100` pattern. The stack-config `sampleRate` field is now considered legacy and should no longer be used for new projects.
