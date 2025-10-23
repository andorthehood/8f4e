import init from '@8f4e/web-ui';

import generateCodeBlockMock from '../utils/generateCodeBlockMock';
import generateStateMock from '../utils/generateStateMock';
import { generateColorMapWithOneColor } from '../utils/generateColorMapMock';

(async function initializeWebUI() {
    const canvas = document.getElementById('test-canvas') as HTMLCanvasElement;

    const mockState = generateStateMock();
    await init(mockState, canvas);

    const allCharacters = Array.from({ length: 128 }, (_, i) => String.fromCharCode(i));

    // split into 16 characters per line
    const lines = allCharacters.reduce<string[][]>((acc, char, index) => {
        if (index % 16 === 0) {
            acc.push([] as string[]);
        }
        acc[acc.length - 1].push(char);
        return acc;
    }, []);

    const colors = [
        'fontBinaryOne',
        'fontBinaryZero',
        'fontCode',
        'fontCodeComment',
        'fontDialogText',
        'fontDialogTitle',
        'fontInstruction',
        'fontLineNumber',
        'fontMenuItemText',
        'fontMenuItemTextHighlighted',
        'fontNumbers',
    ];

    colors.forEach((colorName, index) => {
        if (!mockState.graphicHelper.spriteLookups?.[colorName]) {
            return;
        }

        const color = mockState.graphicHelper.spriteLookups[colorName];
        mockState.graphicHelper.activeViewport.codeBlocks.add(
            generateCodeBlockMock([
                '',
                colorName,
                ...lines.map(line => line.join('')),
                '',
            ], (index % 4) * 8 * 32, 16 * 12 * Math.floor(index / 4), generateColorMapWithOneColor(color, 10), `codeBlock${index}`)
        );
    });

    console.log(mockState.graphicHelper.activeViewport.codeBlocks);

})();
