import { Engine } from '@8f4e/2d-engine';
import { Slider, State } from '../../../state/types';
import { font, fillColor } from '@8f4e/sprite-generator';

export default function drawSliders(engine: Engine, sliders: Slider[], state: State, id: string): void {
	for (let i = 0; i < sliders.length; i++) {
		const slider = sliders[i];
		engine.setSpriteLookup(fillColor);
		engine.drawRectangle(slider.x, slider.y, slider.width, slider.height, 'rgb(255,255,255)');

		const address = state.compiler.memoryAddressLookup[id][slider.id];
		const value = state.compiler.memoryBuffer[address];
		const offset = (value / slider.maxValue) * slider.height;
		engine.drawSprite(slider.x, slider.y + (slider.height - offset), 'rgb(255,255,255)', slider.width, offset);
		engine.setSpriteLookup(font('small_white'));
		//engine.drawText(slider.x, slider.y, '' + value / slider.resolution);
	}
}
