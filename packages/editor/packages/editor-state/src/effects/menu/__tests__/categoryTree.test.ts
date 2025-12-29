import { describe, it, expect } from 'vitest';

import { buildCategoryTree, type CategoryItem } from '../categoryTree';

describe('buildCategoryTree', () => {
	it('should create a flat tree for items without slashes', () => {
		const items: CategoryItem[] = [
			{ slug: 'item1', title: 'Item 1', category: 'CategoryA' },
			{ slug: 'item2', title: 'Item 2', category: 'CategoryB' },
			{ slug: 'item3', title: 'Item 3', category: 'CategoryA' },
		];

		const tree = buildCategoryTree(items);

		expect(tree).toHaveLength(2);
		expect(tree[0].label).toBe('CategoryA');
		expect(tree[0].items).toHaveLength(2);
		expect(tree[0].children).toHaveLength(0);
		expect(tree[1].label).toBe('CategoryB');
		expect(tree[1].items).toHaveLength(1);
	});

	it('should create nested tree for items with slash-delimited categories', () => {
		const items: CategoryItem[] = [
			{ slug: 'item1', title: 'Item 1', category: 'Parent/Child1' },
			{ slug: 'item2', title: 'Item 2', category: 'Parent/Child2' },
			{ slug: 'item3', title: 'Item 3', category: 'Parent' },
		];

		const tree = buildCategoryTree(items);

		expect(tree).toHaveLength(1);
		expect(tree[0].label).toBe('Parent');
		expect(tree[0].items).toHaveLength(1);
		expect(tree[0].children).toHaveLength(2);
		expect(tree[0].children[0].label).toBe('Child1');
		expect(tree[0].children[0].items).toHaveLength(1);
		expect(tree[0].children[1].label).toBe('Child2');
	});

	it('should handle deeply nested categories', () => {
		const items: CategoryItem[] = [
			{ slug: 'item1', title: 'Item 1', category: 'A/B/C/D' },
			{ slug: 'item2', title: 'Item 2', category: 'A/B' },
		];

		const tree = buildCategoryTree(items);

		expect(tree).toHaveLength(1);
		expect(tree[0].label).toBe('A');
		expect(tree[0].items).toHaveLength(0);
		expect(tree[0].children).toHaveLength(1);
		expect(tree[0].children[0].label).toBe('B');
		expect(tree[0].children[0].items).toHaveLength(1);
		expect(tree[0].children[0].children).toHaveLength(1);
		expect(tree[0].children[0].children[0].label).toBe('C');
		expect(tree[0].children[0].children[0].children[0].label).toBe('D');
	});

	it('should sort categories and items alphabetically', () => {
		const items: CategoryItem[] = [
			{ slug: 'item1', title: 'Zebra', category: 'Z' },
			{ slug: 'item2', title: 'Apple', category: 'A' },
			{ slug: 'item3', title: 'Banana', category: 'A' },
		];

		const tree = buildCategoryTree(items);

		expect(tree[0].label).toBe('A');
		expect(tree[0].items[0].title).toBe('Apple');
		expect(tree[0].items[1].title).toBe('Banana');
		expect(tree[1].label).toBe('Z');
	});

	it('should handle missing categories by defaulting to Uncategorized', () => {
		const items: CategoryItem[] = [
			{ slug: 'item1', title: 'Item 1' },
			{ slug: 'item2', title: 'Item 2', category: undefined },
		];

		const tree = buildCategoryTree(items);

		expect(tree).toHaveLength(1);
		expect(tree[0].label).toBe('Uncategorized');
		expect(tree[0].items).toHaveLength(2);
	});

	it('should handle empty category strings', () => {
		const items: CategoryItem[] = [{ slug: 'item1', title: 'Item 1', category: '' }];

		const tree = buildCategoryTree(items);

		expect(tree).toHaveLength(1);
		expect(tree[0].label).toBe('Uncategorized');
	});

	it('should handle mixed nested and flat categories', () => {
		const items: CategoryItem[] = [
			{ slug: 'item1', title: 'Item 1', category: 'Effects/Time' },
			{ slug: 'item2', title: 'Item 2', category: 'Effects/Distortion' },
			{ slug: 'item3', title: 'Item 3', category: 'Oscillators' },
			{ slug: 'item4', title: 'Item 4', category: 'Effects' },
		];

		const tree = buildCategoryTree(items);

		expect(tree).toHaveLength(2);
		expect(tree[0].label).toBe('Effects');
		expect(tree[0].items).toHaveLength(1);
		expect(tree[0].children).toHaveLength(2);
		expect(tree[1].label).toBe('Oscillators');
		expect(tree[1].items).toHaveLength(1);
		expect(tree[1].children).toHaveLength(0);
	});

	it('should generate correct path values for nested nodes', () => {
		const items: CategoryItem[] = [{ slug: 'item1', title: 'Item 1', category: 'A/B/C' }];

		const tree = buildCategoryTree(items);

		expect(tree[0].path).toBe('A');
		expect(tree[0].children[0].path).toBe('A/B');
		expect(tree[0].children[0].children[0].path).toBe('A/B/C');
	});

	it('should handle empty input array', () => {
		const items: CategoryItem[] = [];
		const tree = buildCategoryTree(items);
		expect(tree).toHaveLength(0);
	});
});
