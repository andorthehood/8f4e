import { describe, it, expect } from 'vitest';

import { buildCategoryTree, getSortedCategories, getSortedItems } from './categoryTree';

import type { CategoryItem } from './categoryTree';

describe('categoryTree', () => {
	describe('buildCategoryTree', () => {
		it('should build a flat tree with single-level categories', () => {
			const items: CategoryItem[] = [
				{ slug: 'item1', title: 'Item 1', category: 'CategoryA' },
				{ slug: 'item2', title: 'Item 2', category: 'CategoryB' },
				{ slug: 'item3', title: 'Item 3', category: 'CategoryA' },
			];

			const tree = buildCategoryTree(items);

			expect(tree.children.size).toBe(2);
			expect(tree.children.has('CategoryA')).toBe(true);
			expect(tree.children.has('CategoryB')).toBe(true);
			expect(tree.children.get('CategoryA')?.items.length).toBe(2);
			expect(tree.children.get('CategoryB')?.items.length).toBe(1);
		});

		it('should build nested tree with slash-delimited categories', () => {
			const items: CategoryItem[] = [
				{ slug: 'item1', title: 'Item 1', category: 'Parent/Child1' },
				{ slug: 'item2', title: 'Item 2', category: 'Parent/Child2' },
				{ slug: 'item3', title: 'Item 3', category: 'Parent/Child1/GrandChild' },
			];

			const tree = buildCategoryTree(items);

			expect(tree.children.size).toBe(1);
			expect(tree.children.has('Parent')).toBe(true);

			const parent = tree.children.get('Parent');
			expect(parent?.children.size).toBe(2);
			expect(parent?.children.has('Child1')).toBe(true);
			expect(parent?.children.has('Child2')).toBe(true);
			expect(parent?.children.get('Child1')?.items.length).toBe(1);
			expect(parent?.children.get('Child2')?.items.length).toBe(1);

			const child1 = parent?.children.get('Child1');
			expect(child1?.children.has('GrandChild')).toBe(true);
			expect(child1?.children.get('GrandChild')?.items.length).toBe(1);
		});

		it('should handle items without categories using default category', () => {
			const items: CategoryItem[] = [
				{ slug: 'item1', title: 'Item 1', category: 'CategoryA' },
				{ slug: 'item2', title: 'Item 2' },
			];

			const tree = buildCategoryTree(items);

			expect(tree.children.size).toBe(2);
			expect(tree.children.has('CategoryA')).toBe(true);
			expect(tree.children.has('Uncategorized')).toBe(true);
			expect(tree.children.get('Uncategorized')?.items.length).toBe(1);
		});

		it('should handle custom default category', () => {
			const items: CategoryItem[] = [{ slug: 'item1', title: 'Item 1' }];

			const tree = buildCategoryTree(items, 'Other');

			expect(tree.children.has('Other')).toBe(true);
			expect(tree.children.get('Other')?.items.length).toBe(1);
		});

		it('should handle empty category strings', () => {
			const items: CategoryItem[] = [{ slug: 'item1', title: 'Item 1', category: '' }];

			const tree = buildCategoryTree(items);

			expect(tree.children.has('Uncategorized')).toBe(true);
		});

		it('should trim and filter empty path segments', () => {
			const items: CategoryItem[] = [{ slug: 'item1', title: 'Item 1', category: ' Parent / Child / ' }];

			const tree = buildCategoryTree(items);

			expect(tree.children.has('Parent')).toBe(true);
			const parent = tree.children.get('Parent');
			expect(parent?.children.has('Child')).toBe(true);
		});

		it('should store correct path for nested categories', () => {
			const items: CategoryItem[] = [{ slug: 'item1', title: 'Item 1', category: 'A/B/C' }];

			const tree = buildCategoryTree(items);

			expect(tree.children.get('A')?.path).toBe('A');
			expect(tree.children.get('A')?.children.get('B')?.path).toBe('A/B');
			expect(tree.children.get('A')?.children.get('B')?.children.get('C')?.path).toBe('A/B/C');
		});

		it('should handle multiple items in nested categories', () => {
			const items: CategoryItem[] = [
				{ slug: 'item1', title: 'Item 1', category: 'Functions/Math' },
				{ slug: 'item2', title: 'Item 2', category: 'Functions/Math' },
				{ slug: 'item3', title: 'Item 3', category: 'Functions/String' },
			];

			const tree = buildCategoryTree(items);

			const functions = tree.children.get('Functions');
			expect(functions?.children.get('Math')?.items.length).toBe(2);
			expect(functions?.children.get('String')?.items.length).toBe(1);
		});
	});

	describe('getSortedCategories', () => {
		it('should return sorted category names', () => {
			const items: CategoryItem[] = [
				{ slug: 'item1', title: 'Item 1', category: 'Zebra' },
				{ slug: 'item2', title: 'Item 2', category: 'Apple' },
				{ slug: 'item3', title: 'Item 3', category: 'Mango' },
			];

			const tree = buildCategoryTree(items);
			const sorted = getSortedCategories(tree);

			expect(sorted).toEqual(['Apple', 'Mango', 'Zebra']);
		});

		it('should handle empty node', () => {
			const items: CategoryItem[] = [];
			const tree = buildCategoryTree(items);
			const sorted = getSortedCategories(tree);

			expect(sorted).toEqual([]);
		});
	});

	describe('getSortedItems', () => {
		it('should return items sorted by title', () => {
			const items: CategoryItem[] = [
				{ slug: 'item1', title: 'Zebra Module', category: 'Test' },
				{ slug: 'item2', title: 'Apple Module', category: 'Test' },
				{ slug: 'item3', title: 'Mango Module', category: 'Test' },
			];

			const tree = buildCategoryTree(items);
			const node = tree.children.get('Test')!;
			const sorted = getSortedItems(node);

			expect(sorted.map(item => item.title)).toEqual(['Apple Module', 'Mango Module', 'Zebra Module']);
		});

		it('should handle empty items', () => {
			const items: CategoryItem[] = [];
			const tree = buildCategoryTree(items);
			const sorted = getSortedItems(tree);

			expect(sorted).toEqual([]);
		});

		it('should not mutate original items array', () => {
			const items: CategoryItem[] = [
				{ slug: 'item1', title: 'B', category: 'Test' },
				{ slug: 'item2', title: 'A', category: 'Test' },
			];

			const tree = buildCategoryTree(items);
			const node = tree.children.get('Test')!;
			const originalOrder = node.items.map(item => item.title);

			getSortedItems(node);

			expect(node.items.map(item => item.title)).toEqual(originalOrder);
		});
	});
});
