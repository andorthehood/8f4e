import type { ContextMenuItem } from '~/types';

export interface CategoryItem {
	title: string;
	slug: string;
	category: string;
}

interface CategoryNode {
	name: string;
	children: Map<string, CategoryNode>;
	items: CategoryItem[];
}

/**
 * Normalizes a category path by splitting on '/' and trimming whitespace
 */
export function normalizeCategory(category: string): string[] {
	return category
		.split('/')
		.map(part => part.trim())
		.filter(part => part.length > 0);
}

/**
 * Builds a category tree from a list of items with category paths
 */
export function buildCategoryTree(items: CategoryItem[]): CategoryNode {
	const root: CategoryNode = {
		name: '',
		children: new Map(),
		items: [],
	};

	for (const item of items) {
		const path = normalizeCategory(item.category);

		if (path.length === 0) {
			// Items with no category go to root
			root.items.push(item);
			continue;
		}

		let currentNode = root;
		for (let i = 0; i < path.length; i++) {
			const segment = path[i];

			if (i === path.length - 1) {
				// Last segment - add item to this node
				if (!currentNode.children.has(segment)) {
					currentNode.children.set(segment, {
						name: segment,
						children: new Map(),
						items: [],
					});
				}
				const targetNode = currentNode.children.get(segment)!;
				targetNode.items.push(item);
			} else {
				// Intermediate segment - ensure node exists and traverse
				if (!currentNode.children.has(segment)) {
					currentNode.children.set(segment, {
						name: segment,
						children: new Map(),
						items: [],
					});
				}
				currentNode = currentNode.children.get(segment)!;
			}
		}
	}

	return root;
}

/**
 * Gets a node at a specific path in the tree
 */
export function getNodeAtPath(root: CategoryNode, path: string[]): CategoryNode | null {
	let currentNode = root;
	for (const segment of path) {
		const child = currentNode.children.get(segment);
		if (!child) {
			return null;
		}
		currentNode = child;
	}
	return currentNode;
}

/**
 * Converts a category node to menu items
 * @param node The category node to convert
 * @param path The current path (used for submenu payloads)
 * @param menuName The menu name to use for openSubMenu actions
 * @param itemAction The action to use for leaf items (e.g., 'addCodeBlockBySlug', 'loadProjectBySlug')
 * @param itemPayloadKey The payload key to use for leaf items (e.g., 'codeBlockSlug', 'projectSlug')
 */
export function nodeToMenuItems(
	node: CategoryNode,
	path: string[],
	menuName: string,
	itemAction: string,
	itemPayloadKey: string
): ContextMenuItem[] {
	const menuItems: ContextMenuItem[] = [];

	// Sort child categories alphabetically
	const sortedChildren = Array.from(node.children.entries()).sort((a, b) => a[0].localeCompare(b[0]));

	// Add submenu items for child categories
	for (const [childName] of sortedChildren) {
		menuItems.push({
			title: childName,
			action: 'openSubMenu',
			payload: { menu: menuName, path: [...path, childName] },
			close: false,
		});
	}

	// Sort items alphabetically by title
	const sortedItems = [...node.items].sort((a, b) => a.title.localeCompare(b.title));

	// Add leaf items
	for (const item of sortedItems) {
		menuItems.push({
			title: item.title,
			action: itemAction,
			payload: { [itemPayloadKey]: item.slug },
			close: true,
		});
	}

	return menuItems;
}
