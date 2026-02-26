/**
 * Example demonstrating the use of color helper utilities
 * to derive a custom color scheme from a base color
 */

import { lighten, darken, alpha, mix, ColorScheme } from '@8f4e/sprite-generator';

// Define a base color for our theme
const baseColor = '#00cc00'; // Green
const accentColor = '#ffff00'; // Yellow

// Create a custom color scheme using the helper utilities
export const derivedColorScheme: ColorScheme = {
	text: {
		// Darker shade for line numbers (less prominent)
		lineNumber: darken(baseColor, 0.5),

		// Lighter shade for instructions (more prominent)
		instruction: lighten(baseColor, 0.3),

		// Mid-tone for comments
		codeComment: darken(baseColor, 0.3),

		// Base color for main code
		code: baseColor,

		// Semi-transparent for disabled code
		disabledCode: alpha(baseColor, 0.5),

		// Accent color for numbers
		numbers: accentColor,

		// Menu items
		menuItemText: baseColor,
		menuItemTextHighlighted: darken(accentColor, 0.2),

		// Dialog text
		dialogTitle: lighten(baseColor, 0.4),
		dialogText: lighten(baseColor, 0.2),

		// Binary values
		binaryZero: darken(baseColor, 0.5),
		binaryOne: baseColor,
	},
	fill: {
		// Menu backgrounds
		menuItemBackground: 'rgba(0,0,0,0.9)',
		menuItemBackgroundHighlighted: mix(baseColor, accentColor, 0.5),

		// Main backgrounds
		background: '#000000',
		backgroundDots: darken(baseColor, 0.7),
		backgroundDots2: darken(baseColor, 0.6),

		// Module backgrounds with varying transparency
		moduleBackground: alpha('#000000', 0.85),
		moduleBackgroundDragged: alpha('#000000', 0.7),
		moduleBackgroundDisabled: alpha('#000000', 0.7),

		// Wires with transparency for layering
		wire: alpha(lighten(baseColor, 0.2), 0.6),
		wireHighlighted: alpha(lighten(baseColor, 0.3), 0.8),

		// Error messaging
		errorMessageBackground: '#cc0000',

		// Dialog overlays
		dialogBackground: '#000000',
		dialogDimmer: 'rgba(0,0,0,0.7)',

		// Code highlighting
		highlightedCodeLine: darken(baseColor, 0.8),

		// Plotter
		plotterBackground: '#000000',
		plotterTrace: mix(baseColor, accentColor, 0.6),

		// Misc
		scanLine: '#ff0000',
		sliderThumb: 'rgba(255,0,0,0.5)',

		// Code block highlights (progressive darkening)
		codeBlockHighlightLevel1: darken(baseColor, 0.9),
		codeBlockHighlightLevel2: darken(baseColor, 0.85),
		codeBlockHighlightLevel3: darken(baseColor, 0.8),
	},
	icons: {
		// Connectors
		outputConnectorBackground: darken(baseColor, 0.8),
		inputConnectorBackground: darken(baseColor, 0.8),
		switchBackground: darken(baseColor, 0.8),
		inputConnector: accentColor,
		outputConnector: accentColor,

		// Feedback scale - create a gradient from red to blue
		feedbackScale0: '#ff0000',
		feedbackScale1: mix('#ff0000', '#0000ff', 0.2),
		feedbackScale2: mix('#ff0000', '#0000ff', 0.4),
		feedbackScale3: mix('#ff0000', '#0000ff', 0.6),
		feedbackScale4: mix('#ff0000', '#0000ff', 0.8),
		feedbackScale5: '#0000ff',

		// Arrow
		arrow: baseColor,

		// Piano keys
		pianoKeyWhite: '#ffffff',
		pianoKeyWhiteHighlighted: '#ff0000',
		pianoKeyWhitePressed: '#ffffff',
		pianoKeyBlack: '#000000',
		pianoKeyBlackHighlighted: '#ff0000',
		pianoKeyBlackPressed: '#000000',
		pianoKeyboardBackground: darken(baseColor, 0.5),
		pianoKeyboardNote: '#ffffff',
		pianoKeyboardNoteHighlighted: '#ff0000',
	},
};

console.log('Derived color scheme example:');
console.log('Base color:', baseColor);
console.log('Sample derived colors:');
console.log('  - Line number (darkened 50%):', derivedColorScheme.text.lineNumber);
console.log('  - Instruction (lightened 30%):', derivedColorScheme.text.instruction);
console.log('  - Disabled code (50% alpha):', derivedColorScheme.text.disabledCode);
console.log('  - Wire (lightened 20%, 60% alpha):', derivedColorScheme.fill.wire);
console.log('  - Menu highlight (mixed base + accent):', derivedColorScheme.fill.menuItemBackgroundHighlighted);
