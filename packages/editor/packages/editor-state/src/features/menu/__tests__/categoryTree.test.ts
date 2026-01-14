import { describe, it, expect } from 'vitest';

import { normalizeCategory, buildCategoryTree, getNodeAtPath, nodeToMenuItems } from '../categoryTree';

import type { CategoryItem } from '../categoryTree';

describe('categoryTree', () => {
	describe('normalizeCategory', () => {
		it('should split on / and trim whitespace', () => {
			expect(normalizeCategory('Functions/Math')).toEqual(['Functions', 'Math']);
			expect(normalizeCategory('Functions / Math ')).toEqual(['Functions', 'Math']);
			expect(normalizeCategory(' Audio / Effects / Delay ')).toEqual(['Audio', 'Effects', 'Delay']);
		});

		it('should handle single-level categories', () => {
			expect(normalizeCategory('Audio')).toEqual(['Audio']);
			expect(normalizeCategory(' Audio ')).toEqual(['Audio']);
		});

		it('should handle empty category', () => {
			expect(normalizeCategory('')).toEqual([]);
		});

		it('should filter out empty segments', () => {
			expect(normalizeCategory('Audio//Effects')).toEqual(['Audio', 'Effects']);
			expect(normalizeCategory('Audio/')).toEqual(['Audio']);
		});
	});

	describe('buildCategoryTree', () => {
		it('should build a flat tree for single-level categories', () => {
			const items: CategoryItem[] = [
				{ title: 'Item A', slug: 'a', category: 'Audio' },
				{ title: 'Item B', slug: 'b', category: 'MIDI' },
				{ title: 'Item C', slug: 'c', category: 'Audio' },
			];

			const tree = buildCategoryTree(items);

			expect(tree.children.size).toBe(2);
			expect(tree.children.has('Audio')).toBe(true);
			expect(tree.children.has('MIDI')).toBe(true);

			const audioNode = tree.children.get('Audio')!;
			expect(audioNode.items).toHaveLength(2);
			expect(audioNode.items[0].slug).toBe('a');
			expect(audioNode.items[1].slug).toBe('c');

			const midiNode = tree.children.get('MIDI')!;
			expect(midiNode.items).toHaveLength(1);
			expect(midiNode.items[0].slug).toBe('b');
		});

		it('should build nested tree for multi-level categories', () => {
			const items: CategoryItem[] = [
				{ title: 'Sine', slug: 'sine', category: 'Functions/Math' },
				{ title: 'Cosine', slug: 'cosine', category: 'Functions/Math' },
				{ title: 'Sigmoid', slug: 'sigmoid', category: 'Functions/ML' },
			];

			const tree = buildCategoryTree(items);

			expect(tree.children.size).toBe(1);
			expect(tree.children.has('Functions')).toBe(true);

			const functionsNode = tree.children.get('Functions')!;
			expect(functionsNode.children.size).toBe(2);
			expect(functionsNode.children.has('Math')).toBe(true);
			expect(functionsNode.children.has('ML')).toBe(true);

			const mathNode = functionsNode.children.get('Math')!;
			expect(mathNode.items).toHaveLength(2);

			const mlNode = functionsNode.children.get('ML')!;
			expect(mlNode.items).toHaveLength(1);
		});

		it('should handle items with no category', () => {
			const items: CategoryItem[] = [
				{ title: 'Item A', slug: 'a', category: '' },
				{ title: 'Item B', slug: 'b', category: 'Audio' },
			];

			const tree = buildCategoryTree(items);

			expect(tree.items).toHaveLength(1);
			expect(tree.items[0].slug).toBe('a');
			expect(tree.children.size).toBe(1);
		});

		it('should handle mixed depth categories', () => {
			const items: CategoryItem[] = [
				{ title: 'Item A', slug: 'a', category: 'Audio' },
				{ title: 'Item B', slug: 'b', category: 'Audio/Effects' },
				{ title: 'Item C', slug: 'c', category: 'Audio/Effects/Delay' },
			];

			const tree = buildCategoryTree(items);

			expect(tree.children.size).toBe(1);

			const audioNode = tree.children.get('Audio')!;
			expect(audioNode.items).toHaveLength(1);
			expect(audioNode.items[0].slug).toBe('a');

			const effectsNode = audioNode.children.get('Effects')!;
			expect(effectsNode.items).toHaveLength(1);
			expect(effectsNode.items[0].slug).toBe('b');

			const delayNode = effectsNode.children.get('Delay')!;
			expect(delayNode.items).toHaveLength(1);
			expect(delayNode.items[0].slug).toBe('c');
		});
	});

	describe('getNodeAtPath', () => {
		const items: CategoryItem[] = [
			{ title: 'Sine', slug: 'sine', category: 'Functions/Math' },
			{ title: 'Sigmoid', slug: 'sigmoid', category: 'Functions/ML' },
			{ title: 'Audio A', slug: 'a', category: 'Audio' },
		];
		const tree = buildCategoryTree(items);

		it('should get root node for empty path', () => {
			const node = getNodeAtPath(tree, []);
			expect(node).toBe(tree);
		});

		it('should get node at path', () => {
			const node = getNodeAtPath(tree, ['Functions', 'Math']);
			expect(node).not.toBeNull();
			expect(node!.items).toHaveLength(1);
			expect(node!.items[0].slug).toBe('sine');
		});

		it('should return null for non-existent path', () => {
			const node = getNodeAtPath(tree, ['NonExistent']);
			expect(node).toBeNull();
		});

		it('should return null for partial non-existent path', () => {
			const node = getNodeAtPath(tree, ['Functions', 'NonExistent']);
			expect(node).toBeNull();
		});
	});

	describe('nodeToMenuItems', () => {
		it('should convert flat node to menu items', () => {
			const items: CategoryItem[] = [
				{ title: 'Item B', slug: 'b', category: 'Audio' },
				{ title: 'Item A', slug: 'a', category: 'Audio' },
			];
			const tree = buildCategoryTree(items);
			const audioNode = tree.children.get('Audio')!;

			const menuItems = nodeToMenuItems(audioNode, ['Audio'], 'testMenu', 'testAction', 'testKey');

			expect(menuItems).toHaveLength(2);
			// Should be sorted alphabetically by title
			expect(menuItems[0].title).toBe('Item A');
			expect(menuItems[0].action).toBe('testAction');
			expect(menuItems[0].payload).toEqual({ testKey: 'a' });
			expect(menuItems[0].close).toBe(true);

			expect(menuItems[1].title).toBe('Item B');
			expect(menuItems[1].payload).toEqual({ testKey: 'b' });
		});

		it('should convert nested node to menu items with submenus', () => {
			const items: CategoryItem[] = [
				{ title: 'Sine', slug: 'sine', category: 'Functions/Math' },
				{ title: 'Sigmoid', slug: 'sigmoid', category: 'Functions/ML' },
			];
			const tree = buildCategoryTree(items);
			const functionsNode = tree.children.get('Functions')!;

			const menuItems = nodeToMenuItems(functionsNode, ['Functions'], 'testMenu', 'testAction', 'testKey');

			expect(menuItems).toHaveLength(2);
			// Should be sorted alphabetically by category name
			expect(menuItems[0].title).toBe('Math');
			expect(menuItems[0].action).toBe('openSubMenu');
			expect(menuItems[0].payload).toEqual({ menu: 'testMenu', path: ['Functions', 'Math'] });
			expect(menuItems[0].close).toBe(false);

			expect(menuItems[1].title).toBe('ML');
			expect(menuItems[1].action).toBe('openSubMenu');
			expect(menuItems[1].payload).toEqual({ menu: 'testMenu', path: ['Functions', 'ML'] });
		});

		it('should combine submenus and items, with submenus first', () => {
			const items: CategoryItem[] = [
				{ title: 'Item A', slug: 'a', category: 'Audio' },
				{ title: 'Item B', slug: 'b', category: 'Audio/Effects' },
			];
			const tree = buildCategoryTree(items);
			const audioNode = tree.children.get('Audio')!;

			const menuItems = nodeToMenuItems(audioNode, ['Audio'], 'testMenu', 'testAction', 'testKey');

			expect(menuItems).toHaveLength(2);
			// Submenu should come first
			expect(menuItems[0].title).toBe('Effects');
			expect(menuItems[0].action).toBe('openSubMenu');
			// Item should come second
			expect(menuItems[1].title).toBe('Item A');
			expect(menuItems[1].action).toBe('testAction');
		});
	});
});
