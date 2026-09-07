import { type DefaultEditorInstance, mountDefaultEditor } from '@8f4e/editor-default';
import { sharedAudioContext } from '../shared-audio-context';
import { getExampleId, withExampleId } from './example-url';
import { projectCategories } from './projects';

const gallery = document.querySelector<HTMLDivElement>('#examples-gallery')!;
const mobileLayout = window.matchMedia('(max-width: 800px)');
let activeId: string | null = null;
let activeEditor: DefaultEditorInstance | undefined;
let mountQueue = Promise.resolve();
let revision = 0;
let revealFrame = 0;
let loadTimeout = 0;
let disposed = false;

const items = projectCategories.flatMap(category => {
	const section = document.createElement('section');
	section.className = 'example-category';
	const heading = document.createElement('h2');
	heading.className = 'example-category-heading';
	heading.id = `category-${category.path.replaceAll('/', '-')}`;
	heading.textContent = category.title;
	section.setAttribute('aria-labelledby', heading.id);
	section.append(heading);
	gallery.append(section);

	return category.projects.map(project => {
		const item = document.createElement('section');
		item.className = 'example-item';
		const heading = document.createElement('h3');
		heading.className = 'example-heading';
		const toggle = document.createElement('button');
		toggle.className = 'example-toggle';
		toggle.type = 'button';
		toggle.id = `example-${project.id}`;
		toggle.setAttribute('aria-expanded', 'false');
		toggle.setAttribute('aria-controls', `panel-${project.id}`);
		const title = document.createElement('span');
		title.className = 'example-title';
		title.textContent = project.title;
		const description = document.createElement('span');
		description.className = 'example-description';
		description.textContent = project.description;
		toggle.append(title, description);
		heading.append(toggle);

		const panel = document.createElement('div');
		panel.className = 'example-panel';
		panel.id = `panel-${project.id}`;
		panel.setAttribute('role', 'region');
		panel.setAttribute('aria-labelledby', toggle.id);
		panel.hidden = true;
		const frame = document.createElement('div');
		frame.className = 'editor-frame';
		const status = document.createElement('div');
		status.className = 'example-status';
		status.setAttribute('role', 'status');
		const projectUrl = `https://static.8f4e.com/example-projects/${project.path}`;
		const openLink = document.createElement('a');
		openLink.className = 'open-in-editor-button';
		openLink.textContent = 'Open in editor ↗';
		openLink.href = `https://editor.8f4e.com/?projectUrl=${encodeURIComponent(projectUrl)}`;
		frame.append(status);
		panel.append(frame, openLink);
		item.append(heading, panel);
		section.append(item);
		toggle.addEventListener('click', () => {
			const id = activeId === project.id && mobileLayout.matches ? null : project.id;
			if (id !== activeId) {
				window.history.pushState(null, '', withExampleId(new URL(window.location.href), id));
				selectExample(id);
			}
		});
		return { project, toggle, panel, frame, status, projectUrl };
	});
});

function releaseEditor(): void {
	window.cancelAnimationFrame(revealFrame);
	window.clearTimeout(loadTimeout);
	activeEditor?.dispose();
	activeEditor = undefined;
	for (const item of items) {
		item.frame.querySelector('canvas')?.remove();
	}
}

function selectExample(id: string | null, retry = false): void {
	if (disposed || (activeId === id && !retry)) {
		return;
	}
	activeId = id;
	const currentRevision = ++revision;
	releaseEditor();
	for (const item of items) {
		const selected = item.project.id === id;
		item.toggle.setAttribute('aria-expanded', String(selected));
		item.panel.hidden = !selected;
	}
	const item = items.find(item => item.project.id === id);
	document.title = item ? `${item.project.title} — 8f4e examples` : 'Examples — 8f4e';
	if (!item) {
		return;
	}
	item.status.hidden = false;
	item.status.textContent = 'Loading example…';

	// Serialize mounts so a rapid selection change cannot leave multiple runtimes alive.
	mountQueue = mountQueue.then(async () => {
		if (disposed || currentRevision !== revision) {
			return;
		}
		const canvas = document.createElement('canvas');
		canvas.tabIndex = 0;
		canvas.setAttribute('aria-label', `${item.project.title} editor`);
		item.frame.prepend(canvas);
		const showError = (error: unknown) => {
			if (disposed || currentRevision !== revision) {
				return;
			}
			releaseEditor();
			item.status.hidden = false;
			item.status.textContent = 'This example could not be loaded.';
			const retryButton = document.createElement('button');
			retryButton.type = 'button';
			retryButton.textContent = 'Try again';
			retryButton.addEventListener('click', () => selectExample(id, true));
			item.status.append(retryButton);
			console.error('Failed to load gallery example:', error);
		};
		try {
			const editor = await mountDefaultEditor(canvas, {
				sharedAudioContext,
				captureWheel: true,
				featureFlags: {
					browserLocalNotes: false,
					projectCreation: false,
					projectOpening: false,
				},
				initialEditorMode: 'edit',
				initialProjectUrl: item.projectUrl,
				storage: window.sessionStorage,
				storageNamespace: `8f4e-gallery-${item.project.id}`,
			});
			if (disposed || currentRevision !== revision) {
				editor.dispose();
				canvas.remove();
				return;
			}
			activeEditor = editor;
			loadTimeout = window.setTimeout(() => showError(new Error('Project loading timed out')), 30_000);
			const reveal = () => {
				if (disposed || currentRevision !== revision) {
					return;
				}
				const project = editor.state.initialProjectState;
				if (!project) {
					revealFrame = window.requestAnimationFrame(reveal);
					return;
				}
				if (project.modules.length === 0) {
					showError(new Error('Project is empty'));
					return;
				}
				window.clearTimeout(loadTimeout);
				revealFrame = window.requestAnimationFrame(() => {
					canvas.classList.add('editor-ready');
					item.status.hidden = true;
				});
			};
			reveal();
		} catch (error) {
			showError(error);
		}
	});
}

function onUrlChange(): void {
	const url = new URL(window.location.href);
	const id = getExampleId(url, mobileLayout.matches);
	const nextUrl = withExampleId(url, id);
	if (nextUrl.href !== url.href) {
		window.history.replaceState(window.history.state, '', nextUrl);
	}
	selectExample(id);
}

function onLayoutChange(): void {
	if (!mobileLayout.matches && activeId === null) {
		onUrlChange();
	}
}
mobileLayout.addEventListener('change', onLayoutChange);
window.addEventListener('popstate', onUrlChange);
window.addEventListener('hashchange', onUrlChange);
onUrlChange();
if (mobileLayout.matches && activeId !== null) {
	items.find(item => item.project.id === activeId)?.toggle.scrollIntoView({ block: 'start' });
}

function dispose(): void {
	disposed = true;
	++revision;
	releaseEditor();
	mobileLayout.removeEventListener('change', onLayoutChange);
	window.removeEventListener('popstate', onUrlChange);
	window.removeEventListener('hashchange', onUrlChange);
}
import.meta.hot?.dispose(dispose);
