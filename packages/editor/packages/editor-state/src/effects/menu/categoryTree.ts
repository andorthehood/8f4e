export interface CategoryItem {
	slug: string;
	title: string;
	category?: string;
}

export interface CategoryTreeNode {
	label: string;
	path: string;
	items: CategoryItem[];
	children: Map<string, CategoryTreeNode>;
}

/**
 * Builds a tree structure from items with slash-delimited categories.
 *
 * @param items - Array of items with optional category field
 * @param defaultCategory - Category to use for items without a category (default: "Uncategorized")
 * @returns Root node of the category tree
 */
export function buildCategoryTree(items: CategoryItem[], defaultCategory = 'Uncategorized'): CategoryTreeNode {
	const root: CategoryTreeNode = {
		label: '',
		path: '',
		items: [],
		children: new Map(),
	};

	for (const item of items) {
		const category = item.category || defaultCategory;
		const parts = category
			.split('/')
			.map(part => part.trim())
			.filter(part => part.length > 0);

		let currentNode = root;
		let currentPath = '';

		for (let i = 0; i < parts.length; i++) {
			const part = parts[i];
			currentPath = currentPath ? `${currentPath}/${part}` : part;

			if (!currentNode.children.has(part)) {
				currentNode.children.set(part, {
					label: part,
					path: currentPath,
					items: [],
					children: new Map(),
				});
			}

			currentNode = currentNode.children.get(part)!;
		}

		currentNode.items.push(item);
	}

	return root;
}

/**
 * Gets sorted category names from a tree node.
 *
 * @param node - Tree node to get categories from
 * @returns Sorted array of category names
 */
export function getSortedCategories(node: CategoryTreeNode): string[] {
	return Array.from(node.children.keys()).sort((a, b) => a.localeCompare(b));
}

/**
 * Gets sorted items from a tree node.
 *
 * @param node - Tree node to get items from
 * @returns Sorted array of items by title
 */
export function getSortedItems(node: CategoryTreeNode): CategoryItem[] {
	return node.items.slice().sort((a, b) => a.title.localeCompare(b.title));
}
