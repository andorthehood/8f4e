/**
 * Utility for building nested category trees from flat lists with slash-delimited categories.
 */

export interface CategoryItem {
	slug: string;
	title: string;
	category: string;
}

export interface CategoryTreeNode {
	/** Path segment at this level (e.g., "Functions" in "Functions/Trigonometric") */
	label: string;
	/** Full path to this node (e.g., "Functions/Trigonometric") */
	path: string;
	/** Child category nodes */
	children: CategoryTreeNode[];
	/** Leaf items at this category level */
	items: CategoryItem[];
}

/**
 * Builds a nested category tree from a flat list of items with slash-delimited categories.
 * Categories are split by "/" to create hierarchy (e.g., "Functions/Trigonometric").
 * Empty categories default to "Uncategorized".
 * Results are sorted alphabetically at each level.
 *
 * @param items - List of items with category, slug, and title
 * @returns Root node containing the tree structure
 */
export function buildCategoryTree(items: CategoryItem[]): CategoryTreeNode {
	const root: CategoryTreeNode = {
		label: '',
		path: '',
		children: [],
		items: [],
	};

	// Group items by their full category path
	const categorizedItems = items.map(item => ({
		...item,
		category: item.category || 'Uncategorized',
	}));

	// Build tree structure
	for (const item of categorizedItems) {
		const segments = item.category.split('/').filter(s => s.trim());
		let currentNode = root;
		let currentPath = '';

		// Navigate/create path through tree
		for (let i = 0; i < segments.length; i++) {
			const segment = segments[i].trim();
			currentPath = currentPath ? `${currentPath}/${segment}` : segment;

			// Find or create child node for this segment
			let childNode = currentNode.children.find(c => c.label === segment);
			if (!childNode) {
				childNode = {
					label: segment,
					path: currentPath,
					children: [],
					items: [],
				};
				currentNode.children.push(childNode);
			}
			currentNode = childNode;
		}

		// Add item to the leaf node
		currentNode.items.push(item);
	}

	// Sort all levels alphabetically
	sortTreeNode(root);

	return root;
}

/**
 * Recursively sorts a tree node's children and items alphabetically.
 */
function sortTreeNode(node: CategoryTreeNode): void {
	// Sort child nodes by label
	node.children.sort((a, b) => a.label.localeCompare(b.label));

	// Sort items by title
	node.items.sort((a, b) => a.title.localeCompare(b.title));

	// Recursively sort children
	for (const child of node.children) {
		sortTreeNode(child);
	}
}

/**
 * Flattens a category tree into a list of category paths.
 * Used for generating category menu items.
 *
 * @param node - Root or intermediate tree node
 * @returns List of category paths (e.g., ["Audio", "Functions/Trigonometric"])
 */
export function flattenCategoryPaths(node: CategoryTreeNode): string[] {
	const paths: string[] = [];

	function traverse(n: CategoryTreeNode) {
		// Add this node's path if it has items or children
		if (n.path && (n.items.length > 0 || n.children.length > 0)) {
			paths.push(n.path);
		}

		// Traverse children
		for (const child of n.children) {
			traverse(child);
		}
	}

	traverse(node);
	return paths;
}

/**
 * Finds a node in the tree by its full path.
 *
 * @param root - Root tree node
 * @param path - Full category path (e.g., "Functions/Trigonometric")
 * @returns The node at the path, or null if not found
 */
export function findNodeByPath(root: CategoryTreeNode, path: string): CategoryTreeNode | null {
	if (!path) {
		return root;
	}

	const segments = path.split('/').filter(s => s.trim());
	let currentNode: CategoryTreeNode | null = root;

	for (const segment of segments) {
		const nextNode: CategoryTreeNode | undefined = currentNode?.children.find(c => c.label === segment);
		if (!nextNode) {
			return null;
		}
		currentNode = nextNode;
	}

	return currentNode;
}
