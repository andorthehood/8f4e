import { EventDispatcher } from '../../../events';
import findSwitchAtViewportCoordinates from '../../helpers/findSwitchAtViewportCoordinates';
import { CodeBlockGraphicData, State } from '../../types';

export default function _switch(state: State, events: EventDispatcher): () => void {
	const onOpenGroup = function ({ codeBlock }: { codeBlock: CodeBlockGraphicData}) {
        codeBlock.
	};

	events.on('openGroup', onOpenGroup);

	return () => {
		events.off('openGroup', onOpenGroup);
	};
}
