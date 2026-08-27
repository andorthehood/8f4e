import { createDirectivePlugin } from '../utils';

export default createDirectivePlugin('favorite', (_, draft) => {
	draft.blockState.isFavorite = true;
});
