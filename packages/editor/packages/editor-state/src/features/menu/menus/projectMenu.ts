import { buildCategoryTree, getNodeAtPath, nodeToMenuItems } from '../categoryTree';

import type { MenuGenerator } from '../../../types';
import type { CategoryItem } from '../categoryTree';

export const projectMenu: MenuGenerator = async (state, payload = {}) => {
	const { path = [] } = payload as { path?: string[] };
	if (!state.callbacks.getListOfProjects || !state.callbacks.getProject) {
		return [];
	}
	const projects = await state.callbacks.getListOfProjects();

	const categoryItems: CategoryItem[] = projects.map(project => ({
		title: project.title,
		slug: project.slug,
		category: project.category,
	}));

	const tree = buildCategoryTree(categoryItems);
	const node = path.length === 0 ? tree : getNodeAtPath(tree, path);

	if (!node) {
		return [];
	}

	return nodeToMenuItems(node, path, 'projectMenu', 'loadProjectBySlug', 'projectSlug');
};
