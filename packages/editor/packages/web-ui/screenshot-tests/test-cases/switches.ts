import init from '@8f4e/web-ui';

import generateCodeBlockMock from '../utils/generateCodeBlockMock';
import generateStateMock from '../utils/generateStateMock';
import { generateColorMapWithOneColor } from '../utils/generateColorMapMock';

(async function initializeWebUI() {
	const canvas = document.getElementById('test-canvas') as HTMLCanvasElement;
	const mockState = generateStateMock();
	const webUI = await init(mockState, canvas);

	if (mockState.graphicHelper.spriteLookups) {
		const codeBlockMock = generateCodeBlockMock(
			['selected code block', '', '', '', '', '', '', '', ''],
			16,
			16,
			generateColorMapWithOneColor(mockState.graphicHelper.spriteLookups.fontCode, 10)
		);

		mockState.graphicHelper.selectedCodeBlock = codeBlockMock;

		mockState.graphicHelper.activeViewport.codeBlocks.add(codeBlockMock);

		mockState.graphicHelper.activeViewport.codeBlocks.add(
			generateCodeBlockMock(
				['not selected code block', '', '', '', '', '', '', '', ''],
				288,
				16,
				generateColorMapWithOneColor(mockState.graphicHelper.spriteLookups.fontCode, 10)
			)
		);
	}

	return webUI;
})();
