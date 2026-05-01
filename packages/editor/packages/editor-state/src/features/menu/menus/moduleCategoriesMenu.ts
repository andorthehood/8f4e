import { buildCategoryTree, getNodeAtPath, nodeToMenuItems } from '../categoryTree';

import type { MenuGenerator, State } from '@8f4e/editor-state-types';
import type { CategoryItem } from '../categoryTree';

export const moduleCategoriesMenu: MenuGenerator<State> = async (state, payload = {}) => {
	const { path = [] } = payload as { path?: string[] };
	if (!state.callbacks.getListOfModules) {
		return [];
	}
	const modules = await state.callbacks.getListOfModules();

	const categoryItems: CategoryItem[] = modules.map(module => ({
		title: module.title,
		slug: module.slug,
		category: module.category,
	}));

	const tree = buildCategoryTree(categoryItems);
	const node = path.length === 0 ? tree : getNodeAtPath(tree, path);

	if (!node) {
		return [];
	}

	return nodeToMenuItems(node, path, 'moduleCategoriesMenu', 'addCodeBlockBySlug', 'codeBlockSlug');
};
