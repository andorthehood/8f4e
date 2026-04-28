import * as Plot from '@observablehq/plot';
import './styles.css';

type SizeMetric = 'raw' | 'gzip';

type BundleFileEntry = {
	path: string;
	raw: number;
	gzip: number;
};

type BundleSizeEntry = {
	schemaVersion: number;
	recordedAt: string;
	commit: string;
	branch: string;
	releaseTag: string | null;
	packageName: string;
	projectName: string;
	version: string | null;
	bytes: Record<SizeMetric, number>;
	files: BundleFileEntry[];
};

type TrackedLog = {
	packageName: string;
	label: string;
	path: string;
	files: string[];
};

type BundleSizeManifest = {
	logs: TrackedLog[];
};

type Point = {
	packageName: string;
	label: string;
	recordedAt: Date;
	version: string;
	releaseTag: string;
	commit: string;
	releaseKey: string;
	releaseIndex: number;
	releaseLabel: string;
	metric: SizeMetric;
	bytes: number;
	raw: number;
	gzip: number;
	previousBytes: number | null;
	delta: number | null;
	files: BundleFileEntry[];
};

const app = requireElement<HTMLDivElement>('#app');

app.innerHTML = `
	<header class="app-header">
		<div>
			<h1>Bundle Sizes</h1>
			<p id="last-updated"></p>
		</div>
		<div class="controls" aria-label="Dashboard controls">
			<div class="segmented" role="group" aria-label="Size metric">
				<button type="button" class="segment is-active" data-metric="gzip">Gzip</button>
				<button type="button" class="segment" data-metric="raw">Raw</button>
			</div>
		</div>
	</header>
	<main>
		<section class="summary-grid" id="summary-grid" aria-label="Latest bundle size summary"></section>
		<section class="chart-section package-section">
			<div class="section-heading">
				<h2>Packages</h2>
				<span id="package-caption"></span>
			</div>
			<div class="package-grid" id="package-grid"></div>
		</section>
		<section class="chart-section">
			<div class="section-heading">
				<h2>Growth</h2>
				<span id="growth-caption"></span>
			</div>
			<div class="chart" id="overview-chart"></div>
		</section>
		<section class="chart-section">
			<div class="section-heading">
				<h2>Latest Delta</h2>
				<span id="delta-caption"></span>
			</div>
			<div class="chart chart-short" id="delta-chart"></div>
		</section>
	</main>
`;

const state = {
	metric: 'gzip' as SizeMetric,
	trackedLogs: [] as TrackedLog[],
	points: [] as Point[],
};

const summaryGrid = requireElement<HTMLDivElement>('#summary-grid');
const overviewChart = requireElement<HTMLDivElement>('#overview-chart');
const deltaChart = requireElement<HTMLDivElement>('#delta-chart');
const lastUpdated = requireElement<HTMLParagraphElement>('#last-updated');
const growthCaption = requireElement<HTMLSpanElement>('#growth-caption');
const deltaCaption = requireElement<HTMLSpanElement>('#delta-caption');
const packageCaption = requireElement<HTMLSpanElement>('#package-caption');
const packageGrid = requireElement<HTMLDivElement>('#package-grid');
const metricButtons = [...document.querySelectorAll<HTMLButtonElement>('[data-metric]')];

init().catch((error: unknown) => {
	app.innerHTML = `<div class="error-state"><h1>Bundle Sizes</h1><p>${escapeHtml(getErrorMessage(error))}</p></div>`;
});

async function init() {
	state.trackedLogs = await loadTrackedLogs();
	state.points = await loadPoints(state.trackedLogs);
	render();

	for (const button of metricButtons) {
		button.addEventListener('click', () => {
			state.metric = button.dataset.metric as SizeMetric;
			render();
		});
	}

	window.addEventListener('resize', debounce(render, 100));
}

async function loadTrackedLogs() {
	const response = await fetch('bundle-sizes/manifest.json', {
		cache: 'no-store',
	});

	if (!response.ok) {
		throw new Error(`Failed to load bundle size manifest: ${response.status}`);
	}

	const manifest = (await response.json()) as BundleSizeManifest;
	return manifest.logs;
}

async function loadPoints(trackedLogs: TrackedLog[]) {
	const pointGroups = await Promise.all(
		trackedLogs.map(async log => {
			const response = await fetch(`bundle-sizes/${log.path}`, {
				cache: 'no-store',
			});

			if (!response.ok) {
				throw new Error(`Failed to load ${log.path}: ${response.status}`);
			}

			const entries = (await response.json()) as BundleSizeEntry[];
			return toPoints(log, entries);
		})
	);

	return withReleaseIndexes(pointGroups.flat());
}

function toPoints(log: TrackedLog, entries: BundleSizeEntry[]) {
	const sortedEntries = [...entries].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
	const previousByMetric = new Map<SizeMetric, number>();
	const points: Point[] = [];
	const trackedFiles = new Set(log.files);

	for (const entry of sortedEntries) {
		const files = entry.files.filter(file => trackedFiles.has(file.path));
		const bytes = sumFileBytes(files);

		for (const metric of ['raw', 'gzip'] as const) {
			const metricBytes = bytes[metric];
			const previousBytes = previousByMetric.get(metric) ?? null;

			points.push({
				packageName: log.packageName,
				label: log.label,
				recordedAt: new Date(entry.recordedAt),
				version: entry.version ?? 'unknown',
				releaseTag: entry.releaseTag ?? `${entry.projectName}@${entry.version ?? 'unknown'}`,
				commit: entry.commit,
				releaseKey: entry.commit || entry.recordedAt,
				releaseIndex: 0,
				releaseLabel: '',
				metric,
				bytes: metricBytes,
				raw: bytes.raw,
				gzip: bytes.gzip,
				previousBytes,
				delta: previousBytes === null ? null : metricBytes - previousBytes,
				files,
			});

			previousByMetric.set(metric, metricBytes);
		}
	}

	return points;
}

function sumFileBytes(files: BundleFileEntry[]): Record<SizeMetric, number> {
	return files.reduce(
		(bytes, file) => ({
			raw: bytes.raw + file.raw,
			gzip: bytes.gzip + file.gzip,
		}),
		{ raw: 0, gzip: 0 }
	);
}

function withReleaseIndexes(points: Point[]) {
	const releaseDates = new Map<string, Date>();

	for (const point of points) {
		const currentDate = releaseDates.get(point.releaseKey);

		if (!currentDate || point.recordedAt < currentDate) {
			releaseDates.set(point.releaseKey, point.recordedAt);
		}
	}

	const releases = [...releaseDates.entries()]
		.sort(([, dateA], [, dateB]) => dateA.getTime() - dateB.getTime())
		.map(([key], index) => ({
			key,
			index,
			label: `${index + 1} · ${shortCommit(key)}`,
		}));
	const releaseByKey = new Map(releases.map(release => [release.key, release]));

	return points.map(point => {
		const release = releaseByKey.get(point.releaseKey);

		if (!release) {
			return point;
		}

		return {
			...point,
			releaseIndex: release.index,
			releaseLabel: release.label,
		};
	});
}

function render() {
	for (const button of metricButtons) {
		button.classList.toggle('is-active', button.dataset.metric === state.metric);
	}

	const metricPoints = state.points.filter(point => point.metric === state.metric);
	const latestPoints = getLatestPoints(metricPoints);
	const latestDate = getLatestDate(latestPoints);

	lastUpdated.textContent = latestDate ? `Last recorded ${formatDateTime(latestDate)}` : 'No recorded data';
	growthCaption.textContent = metricLabel(state.metric);
	deltaCaption.textContent = metricLabel(state.metric);
	packageCaption.textContent = metricLabel(state.metric);

	renderSummary(latestPoints);
	renderOverview(metricPoints);
	renderDelta(latestPoints);
	renderPackageGrid(metricPoints);
}

function renderSummary(latestPoints: Point[]) {
	const appPoint = latestPoints.find(point => point.packageName === '8f4e') ?? null;
	const largest = latestPoints
		.filter(point => point.delta !== null)
		.sort((a, b) => Math.abs(b.delta ?? 0) - Math.abs(a.delta ?? 0))[0];
	const totalTrackedBytes = latestPoints.reduce((sum, point) => sum + point.bytes, 0);
	const snapshotCount = new Set(state.points.map(point => point.releaseKey)).size;

	summaryGrid.innerHTML = [
		renderSummaryItem('App', appPoint ? formatBytes(appPoint.bytes) : 'n/a', appPoint ? formatPointMeta(appPoint) : ''),
		renderSummaryItem('Tracked Total', formatBytes(totalTrackedBytes), `${latestPoints.length} packages`),
		renderSummaryItem(
			'Largest Delta',
			largest?.delta === null || !largest ? 'n/a' : formatDelta(largest.delta),
			largest ? largest.label : ''
		),
		renderSummaryItem('Snapshots', String(snapshotCount), 'release commits'),
	].join('');
}

function renderSummaryItem(label: string, value: string, meta: string) {
	return `
		<article class="summary-item">
			<span>${escapeHtml(label)}</span>
			<strong>${escapeHtml(value)}</strong>
			<small>${escapeHtml(meta)}</small>
		</article>
	`;
}

function renderOverview(points: Point[]) {
	const releaseLabels = getReleaseLabels(points);
	const hasTrend = hasMultipleSnapshots(points);

	replaceChart(
		overviewChart,
		Plot.plot({
			width: getChartWidth(overviewChart),
			height: 340,
			marginLeft: 64,
			marginRight: 24,
			marginTop: 18,
			marginBottom: 44,
			x: {
				label: null,
				grid: true,
				tickFormat: index => releaseLabels.get(Number(index)) ?? String(index),
			},
			y: {
				label: `${metricLabel(state.metric)} bytes`,
				grid: true,
				tickFormat: formatCompactBytes,
			},
			color: { legend: true },
			marks: [
				Plot.ruleY([0]),
				...(hasTrend
					? [
							Plot.lineY(points, {
								x: 'releaseIndex',
								y: 'bytes',
								stroke: 'label',
								strokeWidth: 2.25,
								tip: true,
							}),
						]
					: []),
				Plot.dot(points, {
					x: 'releaseIndex',
					y: 'bytes',
					fill: 'label',
					r: 4,
					title: point => `${point.label}\n${point.releaseTag}\n${point.releaseLabel}\n${formatBytes(point.bytes)}`,
				}),
			],
		})
	);
}

function renderDelta(latestPoints: Point[]) {
	const deltaPoints = latestPoints.filter(point => point.delta !== null);

	if (deltaPoints.length === 0) {
		deltaChart.replaceChildren(createEmptyChart('No previous snapshot'));
		return;
	}

	replaceChart(
		deltaChart,
		Plot.plot({
			width: getChartWidth(deltaChart),
			height: 260,
			marginLeft: 64,
			marginRight: 24,
			marginTop: 18,
			marginBottom: 72,
			x: { label: null, tickRotate: -24 },
			y: {
				label: `${metricLabel(state.metric)} delta`,
				grid: true,
				tickFormat: formatCompactBytes,
			},
			color: {
				range: ['#b42318', '#027a48'],
			},
			marks: [
				Plot.ruleY([0]),
				Plot.barY(deltaPoints, {
					x: 'label',
					y: 'delta',
					fill: point => ((point.delta ?? 0) > 0 ? 'increase' : 'decrease'),
					title: point => `${point.label}\n${formatDelta(point.delta ?? 0)}`,
				}),
			],
		})
	);
}

function renderPackageGrid(points: Point[]) {
	packageGrid.replaceChildren();

	for (const log of state.trackedLogs) {
		const packagePoints = points.filter(point => point.packageName === log.packageName);
		const latestPoint = packagePoints[packagePoints.length - 1] ?? null;
		const card = document.createElement('article');
		card.className = 'package-card';
		card.innerHTML = `
			<div class="package-card-header">
				<div>
					<h3>${escapeHtml(log.label)}</h3>
					<p>${latestPoint ? escapeHtml(formatPointMeta(latestPoint)) : ''}</p>
				</div>
				<strong>${latestPoint ? escapeHtml(formatBytes(latestPoint.bytes)) : 'n/a'}</strong>
			</div>
			<div class="package-card-chart"></div>
			${renderFileTable(latestPoint)}
		`;

		packageGrid.append(card);
		const chartContainer = card.querySelector<HTMLElement>('.package-card-chart');

		if (chartContainer) {
			replaceChart(chartContainer, createPackageChart(chartContainer, packagePoints));
		}
	}
}

function createPackageChart(container: HTMLElement, points: Point[]) {
	const releaseLabels = getReleaseLabels(points);
	const hasTrend = hasMultipleSnapshots(points);

	return Plot.plot({
		width: getChartWidth(container),
		height: 170,
		marginLeft: 54,
		marginRight: 16,
		marginTop: 12,
		marginBottom: 36,
		x: {
			label: null,
			grid: true,
			tickFormat: index => releaseLabels.get(Number(index)) ?? String(index),
		},
		y: {
			label: `${metricLabel(state.metric)} bytes`,
			grid: true,
			tickFormat: formatCompactBytes,
		},
		marks: [
			Plot.ruleY([0]),
			...(hasTrend
				? [
						Plot.lineY(points, {
							x: 'releaseIndex',
							y: 'bytes',
							stroke: '#1d4ed8',
							strokeWidth: 2,
						}),
					]
				: []),
			Plot.dot(points, {
				x: 'releaseIndex',
				y: 'bytes',
				fill: '#1d4ed8',
				r: 4,
				title: point => `${point.releaseTag}\n${point.releaseLabel}\n${formatBytes(point.bytes)}`,
			}),
		],
	});
}

function renderFileTable(point: Point | null) {
	if (!point) {
		return '<div class="empty-table">No files</div>';
	}

	return `
		<div class="file-table-wrap">
			<table class="file-table">
				<thead>
					<tr>
						<th>File</th>
						<th>Raw</th>
						<th>Gzip</th>
					</tr>
				</thead>
				<tbody>
					${point.files
						.map(
							file => `
								<tr>
									<td>${escapeHtml(file.path)}</td>
									<td>${formatBytes(file.raw)}</td>
									<td>${formatBytes(file.gzip)}</td>
								</tr>
							`
						)
						.join('')}
				</tbody>
			</table>
		</div>
	`;
}

function replaceChart(container: HTMLElement, chart: SVGSVGElement | HTMLElement) {
	container.replaceChildren(chart);
}

function createEmptyChart(message: string) {
	const element = document.createElement('div');
	element.className = 'empty-chart';
	element.textContent = message;
	return element;
}

function getLatestPoints(points: Point[]) {
	return state.trackedLogs
		.map(log => points.filter(point => point.packageName === log.packageName).at(-1))
		.filter((point): point is Point => Boolean(point));
}

function getLatestDate(points: Point[]) {
	return points.map(point => point.recordedAt).sort((a, b) => b.getTime() - a.getTime())[0] ?? null;
}

function getChartWidth(container: HTMLElement) {
	return Math.max(280, Math.floor(container.getBoundingClientRect().width));
}

function getReleaseLabels(points: Point[]) {
	return new Map(points.map(point => [point.releaseIndex, point.releaseLabel]));
}

function hasMultipleSnapshots(points: Point[]) {
	return new Set(points.map(point => point.releaseIndex)).size > 1;
}

function formatBytes(bytes: number) {
	if (bytes < 1024) {
		return `${bytes} B`;
	}

	return `${(bytes / 1024).toFixed(1)} KiB`;
}

function formatCompactBytes(bytes: number) {
	if (Math.abs(bytes) < 1024) {
		return `${bytes} B`;
	}

	return `${Math.round(bytes / 1024)} KiB`;
}

function formatDelta(delta: number) {
	return `${delta > 0 ? '+' : ''}${formatBytes(delta)}`;
}

function formatPointMeta(point: Point) {
	return `${point.releaseTag} · ${shortCommit(point.commit)}`;
}

function metricLabel(metric: SizeMetric) {
	return metric === 'raw' ? 'Raw' : 'Gzip';
}

function shortCommit(commit: string) {
	return commit.slice(0, 8);
}

function formatDateTime(date: Date) {
	return new Intl.DateTimeFormat(undefined, {
		dateStyle: 'medium',
		timeStyle: 'short',
	}).format(date);
}

function debounce(callback: () => void, waitMs: number) {
	let timeout: number | undefined;

	return () => {
		window.clearTimeout(timeout);
		timeout = window.setTimeout(callback, waitMs);
	};
}

function getErrorMessage(error: unknown) {
	return error instanceof Error ? error.message : String(error);
}

function escapeHtml(value: string) {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

function requireElement<TElement extends Element>(selector: string) {
	const element = document.querySelector<TElement>(selector);

	if (!element) {
		throw new Error(`Missing element: ${selector}`);
	}

	return element;
}
