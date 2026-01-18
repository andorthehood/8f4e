/**
 * Types for menu feature - context menus and menu generation.
 */

import type { Position } from '../../shared/types';

interface ContextMenuButton {
	action?: string;
	selector?: string;
	value?: unknown;
	close?: boolean;
	payload?: Record<string, unknown>;
	disabled?: boolean;
	divider?: boolean;
	title?: string;
	isSectionTitle?: boolean;
}

interface MenuItemDivider extends ContextMenuButton {
	divider: true;
	title: never;
}

export type ContextMenuItem = ContextMenuButton | MenuItemDivider;

// Note: MenuGenerator uses 'any' for state to avoid circular dependency.
// The actual State type is imported from ../../types.ts in consuming code.
export type MenuGenerator = (state: any, payload?: unknown) => ContextMenuItem[] | Promise<ContextMenuItem[]>;

export interface MenuStackEntry {
	menu: string;
	payload?: unknown;
}

export interface ContextMenu extends Position {
	highlightedItem: number;
	itemWidth: number;
	items: ContextMenuItem[];
	open: boolean;
	menuStack: MenuStackEntry[];
}
