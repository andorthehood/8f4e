export interface CategoryItem {
	slug: string;
	title: string;
	category?: string;
}

export interface CategoryTreeNode {
	label: string;
	path: string;
	items: CategoryItem[];
	children: CategoryTreeNode[];
}

export function buildCategoryTree(items: CategoryItem[]): CategoryTreeNode[] {
	const rootNodes: CategoryTreeNode[] = [];
	const nodeMap = new Map<string, CategoryTreeNode>();

	for (const item of items) {
		const category = item.category || 'Uncategorized';
		const parts = category.split('/').filter(part => part.length > 0);

		let currentPath = '';
		let currentLevel = rootNodes;
		let parentMap = nodeMap;

		for (let i = 0; i < parts.length; i++) {
			const part = parts[i];
			currentPath = currentPath ? `${currentPath}/${part}` : part;

			let node = parentMap.get(currentPath);
			if (!node) {
				node = {
					label: part,
					path: currentPath,
					items: [],
					children: [],
				};
				parentMap.set(currentPath, node);
				currentLevel.push(node);
			}

			if (i === parts.length - 1) {
				node.items.push(item);
			}

			currentLevel = node.children;
			parentMap = nodeMap;
		}
	}

	sortTree(rootNodes);
	return rootNodes;
}

function sortTree(nodes: CategoryTreeNode[]): void {
	nodes.sort((a, b) => a.label.localeCompare(b.label));

	for (const node of nodes) {
		node.items.sort((a, b) => a.title.localeCompare(b.title));
		sortTree(node.children);
	}
}
