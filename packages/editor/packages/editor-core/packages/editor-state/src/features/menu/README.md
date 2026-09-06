# Menu Feature

## Purpose

Manages context menu opening, navigation, highlighting, placement, and action dispatch.

## Loading and Lifecycle

`effect.ts` registers lightweight event handlers at startup. `loadMenuBuilders.ts` imports all builders from `menus/`
on first menu use and shares the pending/resolved promise across editor instances. A failed import clears that promise
so a later open can retry where the browser's module loader permits recovery.

Each open, submenu, or Back action supersedes earlier requests. Results are checked both after importing builders and
after awaiting the selected builder. Dismissal, a changed selection, a replaced block collection, changed editing or
context-menu flags, and disposal invalidate pending work. State subscriptions catch selection changes even if the
original selection is restored before a request completes; identity checks also catch direct state changes at await
boundaries.

A root menu stays hidden until its items are ready. Pointer listeners are installed immediately, allowing a click to
cancel a pending open while retaining event consumption. Existing submenu items remain usable during asynchronous
navigation; items and navigation history are committed together only after a successful build. Failures close the
menu and are reported to the console. Disposal removes all pointer/navigation listeners and state subscriptions.

## Events and State

- `contextmenu`: starts a fresh main or module menu at the pointer position and resets navigation history.
- `openSubMenu`: builds a named menu with its payload and appends a successful navigation entry.
- `menuBack`: returns to the previous submenu, or the main menu when history is empty.
- `mousemove`: updates `state.contextMenu.highlightedItem` and consumes the event while a menu is active.
- `mousedown`: dispatches the highlighted action or selector, closing first for closeable actions; outside clicks dismiss.

`state.contextMenu` owns `open`, `items`, `itemWidth`, `highlightedItem`, `menuStack`, and world-coordinate `x`/`y`.
Placement is snapped to the grid and clamped within the viewport after building each menu. Hit testing translates
world coordinates back into viewport coordinates so menus track viewport movement.

## Menu Contents

`menus/` provides main, module, favorites, and module-category builders. Categories can fetch their catalog
asynchronously. Editing actions respect editing flags, while view-mode navigation remains available. Shared group,
connection, and tokenizer helpers remain available to the editor features that also consume them.

See [TODO 484 results](../../../../../../../../../docs/todos/archived/484-lazy-load-context-menu-builders.md)
for production measurements and validation.
