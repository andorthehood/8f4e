import { createDirectivePlugin } from '../utils';

export default createDirectivePlugin('disabled', (_, draft) => {
	draft.blockState.disabled = true;
});
