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

// Note: MenuGenerator uses generic S to allow proper typing while avoiding circular dependency.
// The actual State type is provided when the generator is called.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MenuGenerator<S = any> = (state: S, payload?: unknown) => ContextMenuItem[] | Promise<ContextMenuItem[]>;

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
