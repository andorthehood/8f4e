let formatterPromise: Promise<typeof import('./serializeTo8f4e')> | undefined;

/** Reuse the import across exports and editors, without retaining a failed attempt. */
export default function loadProjectFormatter(): Promise<typeof import('./serializeTo8f4e')> {
	formatterPromise ??= import('./serializeTo8f4e').catch(error => {
		formatterPromise = undefined;
		throw error;
	});
	return formatterPromise;
}
