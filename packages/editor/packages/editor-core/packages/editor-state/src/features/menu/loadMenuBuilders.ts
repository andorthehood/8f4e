let buildersPromise: Promise<typeof import('./menus')> | undefined;

/** Share the first import across editors; allow retry after a recoverable load failure. */
export default function loadMenuBuilders(): Promise<typeof import('./menus')> {
	buildersPromise ??= import('./menus').catch(error => {
		buildersPromise = undefined;
		throw error;
	});
	return buildersPromise;
}
