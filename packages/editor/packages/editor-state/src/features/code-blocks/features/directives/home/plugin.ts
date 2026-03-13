import { createDirectivePlugin } from '../utils';

export default createDirectivePlugin('home', (_, draft) => {
	draft.blockState.isHome = true;
});
