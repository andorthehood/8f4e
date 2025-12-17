import { describe, it, expect } from 'vitest';

import { buildCategoryTree, flattenCategoryPaths, findNodeByPath, type CategoryItem } from './categoryTree';

describe('categoryTree', () => {
	describe('buildCategoryTree', () => {
		it('should build a flat tree from single-level categories', () => {
			const items: CategoryItem[] = [
				{ slug: 'item1', title: 'Item 1', category: 'Audio' },
				{ slug: 'item2', title: 'Item 2', category: 'Effects' },
				{ slug: 'item3', title: 'Item 3', category: 'Audio' },
			];

			const tree = buildCategoryTree(items);

			expect(tree.children).toHaveLength(2);
			expect(tree.children[0].label).toBe('Audio');
			expect(tree.children[0].items).toHaveLength(2);
			expect(tree.children[1].label).toBe('Effects');
			expect(tree.children[1].items).toHaveLength(1);
		});

		it('should build a nested tree from slash-delimited categories', () => {
			const items: CategoryItem[] = [
				{ slug: 'sine', title: 'Sine', category: 'Functions/Trigonometric' },
				{ slug: 'sigmoid', title: 'Sigmoid', category: 'Functions/Activation' },
				{ slug: 'quadratic', title: 'Quadratic', category: 'Functions/Polynomial' },
			];

			const tree = buildCategoryTree(items);

			expect(tree.children).toHaveLength(1);
			expect(tree.children[0].label).toBe('Functions');
			expect(tree.children[0].path).toBe('Functions');
			expect(tree.children[0].children).toHaveLength(3);

			const trigNode = tree.children[0].children.find(c => c.label === 'Trigonometric');
			expect(trigNode).toBeDefined();
			expect(trigNode!.path).toBe('Functions/Trigonometric');
			expect(trigNode!.items).toHaveLength(1);
			expect(trigNode!.items[0].slug).toBe('sine');
		});

		it('should sort categories and items alphabetically', () => {
			const items: CategoryItem[] = [
				{ slug: 'item1', title: 'Zebra', category: 'Zoo' },
				{ slug: 'item2', title: 'Apple', category: 'Fruit' },
				{ slug: 'item3', title: 'Banana', category: 'Fruit' },
				{ slug: 'item4', title: 'Yak', category: 'Zoo' },
			];

			const tree = buildCategoryTree(items);

			// Categories should be alphabetical
			expect(tree.children[0].label).toBe('Fruit');
			expect(tree.children[1].label).toBe('Zoo');

			// Items within categories should be alphabetical
			expect(tree.children[0].items[0].title).toBe('Apple');
			expect(tree.children[0].items[1].title).toBe('Banana');
			expect(tree.children[1].items[0].title).toBe('Yak');
			expect(tree.children[1].items[1].title).toBe('Zebra');
		});

		it('should handle empty categories by using "Uncategorized"', () => {
			const items: CategoryItem[] = [
				{ slug: 'item1', title: 'Item 1', category: '' },
				{ slug: 'item2', title: 'Item 2', category: 'Audio' },
			];

			const tree = buildCategoryTree(items);

			expect(tree.children).toHaveLength(2);
			const uncategorized = tree.children.find(c => c.label === 'Uncategorized');
			expect(uncategorized).toBeDefined();
			expect(uncategorized!.items).toHaveLength(1);
		});

		it('should handle mixed depth categories', () => {
			const items: CategoryItem[] = [
				{ slug: 'item1', title: 'Item 1', category: 'Audio' },
				{ slug: 'item2', title: 'Item 2', category: 'Audio/Effects' },
				{ slug: 'item3', title: 'Item 3', category: 'Audio/Effects/Reverb' },
			];

			const tree = buildCategoryTree(items);

			expect(tree.children).toHaveLength(1);
			expect(tree.children[0].label).toBe('Audio');
			expect(tree.children[0].items).toHaveLength(1);
			expect(tree.children[0].children).toHaveLength(1);
			expect(tree.children[0].children[0].label).toBe('Effects');
			expect(tree.children[0].children[0].items).toHaveLength(1);
			expect(tree.children[0].children[0].children).toHaveLength(1);
			expect(tree.children[0].children[0].children[0].label).toBe('Reverb');
			expect(tree.children[0].children[0].children[0].items).toHaveLength(1);
		});

		it('should trim whitespace from category segments', () => {
			const items: CategoryItem[] = [{ slug: 'item1', title: 'Item 1', category: '  Audio  /  Effects  ' }];

			const tree = buildCategoryTree(items);

			expect(tree.children[0].label).toBe('Audio');
			expect(tree.children[0].children[0].label).toBe('Effects');
		});
	});

	describe('flattenCategoryPaths', () => {
		it('should return all category paths in a flat list', () => {
			const items: CategoryItem[] = [
				{ slug: 'sine', title: 'Sine', category: 'Functions/Trigonometric' },
				{ slug: 'sigmoid', title: 'Sigmoid', category: 'Functions/Activation' },
				{ slug: 'audio1', title: 'Audio 1', category: 'Audio' },
			];

			const tree = buildCategoryTree(items);
			const paths = flattenCategoryPaths(tree);

			expect(paths).toContain('Functions');
			expect(paths).toContain('Functions/Trigonometric');
			expect(paths).toContain('Functions/Activation');
			expect(paths).toContain('Audio');
		});

		it('should return empty array for empty tree', () => {
			const tree = buildCategoryTree([]);
			const paths = flattenCategoryPaths(tree);

			expect(paths).toHaveLength(0);
		});
	});

	describe('findNodeByPath', () => {
		const items: CategoryItem[] = [
			{ slug: 'sine', title: 'Sine', category: 'Functions/Trigonometric' },
			{ slug: 'sigmoid', title: 'Sigmoid', category: 'Functions/Activation' },
			{ slug: 'audio1', title: 'Audio 1', category: 'Audio' },
		];

		it('should find a node by its full path', () => {
			const tree = buildCategoryTree(items);
			const node = findNodeByPath(tree, 'Functions/Trigonometric');

			expect(node).not.toBeNull();
			expect(node!.label).toBe('Trigonometric');
			expect(node!.items).toHaveLength(1);
			expect(node!.items[0].slug).toBe('sine');
		});

		it('should find intermediate nodes', () => {
			const tree = buildCategoryTree(items);
			const node = findNodeByPath(tree, 'Functions');

			expect(node).not.toBeNull();
			expect(node!.label).toBe('Functions');
			expect(node!.children).toHaveLength(2);
		});

		it('should return root for empty path', () => {
			const tree = buildCategoryTree(items);
			const node = findNodeByPath(tree, '');

			expect(node).toBe(tree);
		});

		it('should return null for non-existent path', () => {
			const tree = buildCategoryTree(items);
			const node = findNodeByPath(tree, 'NonExistent/Path');

			expect(node).toBeNull();
		});
	});
});
