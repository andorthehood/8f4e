import { buildCategoryTree, getNodeAtPath, nodeToMenuItems } from '../categoryTree';

import type { MenuGenerator } from '~/types';
import type { CategoryItem } from '../categoryTree';

export const moduleCategoriesMenu: MenuGenerator = async (state, payload = {}) => {
	const { path = [] } = payload as { path?: string[] };
	if (!state.callbacks.getListOfModules) {
		return [];
	}
	const modules = await state.callbacks.getListOfModules();

	const categoryItems: CategoryItem[] = modules.map((module: import('~/types').ModuleMetadata) => ({
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
