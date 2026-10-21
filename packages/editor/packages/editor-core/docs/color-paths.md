# Color Paths

Use these paths as the suffix after `color.` with:

```txt
; @config color.<path> <value>
```

Example:

```txt
; @config color.fill.moduleBackground rgba(0,0,0,0.9)
```

## `text.*`

- `text.lineNumber`
- `text.entryName`
- `text.arrow`
- `text.instruction`
- `text.codeComment`
- `text.code`
- `text.errorMessage`
- `text.disabledCode`
- `text.numbers`
- `text.menuItemText`
- `text.menuItemTextHighlighted`
- `text.dialogTitle`
- `text.dialogText`
- `text.binaryZero`
- `text.binaryOne`
- `text.basePrefix`
- `text.pianoKeyWhitePressedOverlay`
- `text.pianoKeyBlackPressedOverlay`
- `text.controlKnob`

## `fill.*`

- `fill.menuItemBackground`
- `fill.menuItemBackgroundHighlighted`
- `fill.background`
- `fill.backgroundDots`
- `fill.backgroundDots2`
- `fill.moduleBackground`
- `fill.moduleBackgroundDragged`
- `fill.moduleBackgroundDisabled`
- `fill.wire`
- `fill.wireHighlighted`
- `fill.errorMessageBackground`
- `fill.dialogBackground`
- `fill.dialogDimmer`
- `fill.highlightedCodeLine`
- `fill.trace`
- `fill.plotterBackground`
- `fill.bars`
- `fill.waveform`
- `fill.meterGreen`
- `fill.meterYellow`
- `fill.meterRed`
- `fill.scanLine`
- `fill.track`
- `fill.fill`
- `fill.controlKnob`
- `fill.crossfadeHandle`
- `fill.codeBlockHighlightLevel1`
- `fill.codeBlockHighlightLevel2`
- `fill.codeBlockHighlightLevel3`
- `fill.pianoKeyWhite`
- `fill.pianoKeyBlack`
- `fill.switchBackground`

## `icons.*`

- `icons.inputConnector`
- `icons.outputConnector`
- `icons.inputConnectorBackground`
- `icons.outputConnectorBackground`

`text.controlKnob` and `fill.controlKnob` style the knob shared by `@button`, `@switch`, and `@slider`. The text color
styles the `|` marker inside the knob; sliders draw one marker on each row.

`fill.crossfadeHandle` styles `@crossfade` handles independently.

## Feedback Scale Entries

Feedback scale entries use indexed icon paths:

- `icons.feedbackScale0`
- `icons.feedbackScale1`
- `icons.feedbackScale2`
- `icons.feedbackScale3`
- `icons.feedbackScale4`
- `icons.feedbackScale5`
