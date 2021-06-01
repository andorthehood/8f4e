export default function save(state, events) {
	const onSave = function () {
		const json = JSON.stringify({
			connections: state.ui.connections,
			modules: state.ui.modules,
			sructureVersion: state.ui.sructureVersion,
			viewport: state.ui.viewport,
		});

		const blob = new Blob([json], { type: 'octet/stream' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		document.body.appendChild(a);
		a.style.display = 'none';
		a.href = url;
		a.download = '8f4e.4e';
		a.click();
		URL.revokeObjectURL(url);
	};

	events.on('save', onSave);
}
