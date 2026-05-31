import { createDirectivePlugin } from '../utils';

export default createDirectivePlugin('alwaysOnTop', (_directive, draft) => {
	draft.blockState.alwaysOnTop = true;
});
