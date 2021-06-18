import { Engine } from '2d-engine';
import { ModuleType, State } from '../../../state/types';
import { font, fillColor } from 'sprite-generator';

export default function drawSliders(engine: Engine, moduleType: ModuleType, state: State, id: string): void {
	for (let i = 0; i < moduleType.sliders.length; i++) {
		const slider = moduleType.sliders[i];
		engine.setSpriteLookup(fillColor);
		engine.drawRectangle(slider.x, slider.y, slider.width, slider.height, 'rgb(255,255,255)');

		const address =
			state.compiler.outputAddressLookup[id + '_' + slider.id] / state.compiler.memoryBuffer.BYTES_PER_ELEMENT;
		const value = state.compiler.memoryBuffer[address];
		const offset = (value / slider.maxValue) * slider.height;
		engine.drawSprite(slider.x, slider.y + (slider.height - offset), 'rgb(255,255,255)', slider.width, offset);
		engine.setSpriteLookup(font('small_white'));
		//engine.drawText(slider.x, slider.y, '' + value / slider.resolution);
	}
}
