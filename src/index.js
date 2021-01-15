import './ui/view/webgl/index.js';

if (localStorage.getItem('ui')) {
	window.ui = JSON.parse(localStorage.getItem('ui'));
} else {
	window.ui = {
		cursor: [0, 0],
		selectArea: [0, 0, 0, 0],
		modules: [],
		connections: [],
	};
}

document.addEventListener('contextmenu', e => {
	const x = e.clientX;
	const y = e.clientY;

	e.preventDefault();

	if (!ui.contextMenu) {
		ui.contextMenu = {};
	}
	ui.contextMenu.open = true;
	ui.contextMenu.position = [x, y];
	ui.contextMenu.items = ['Hello', 'Close'];

	return false;
});

document.addEventListener('mousedown', e => {
	const x = e.clientX;
	const y = e.clientY;

	const draggedModule = ui.modules.find(
		({ position, size }) =>
			x >= position[0] && x <= position[0] + size[0] && y >= position[1] && y <= position[1] + size[1]
	);

	ui.selectArea[0] = x;
	ui.selectArea[1] = y;

	if (draggedModule) {
		draggedModule.beingDragged = true;
		draggedModule.isSelected = true;
	}
});

document.addEventListener('mousemove', e => {
	const x = e.clientX;
	const y = e.clientY;

	const draggedModule = ui.modules.find(({ beingDragged }) => beingDragged);

	if (draggedModule) {
		draggedModule.position[0] += e.movementX;
		draggedModule.position[1] += e.movementY;
	} else {
		if (e.buttons === 1) {
			ui.selectArea[2] += e.movementX;
			ui.selectArea[3] += e.movementY;
		}
	}

	ui.cursor[0] = e.clientX;
	ui.cursor[1] = e.clientY;
});

document.addEventListener('mouseup', e => {
	const draggedModule = ui.modules.find(({ beingDragged }) => beingDragged);

	if (draggedModule) {
		draggedModule.beingDragged = false;
		draggedModule.position[0] = Math.round(draggedModule.position[0] / 10) * 10;
		draggedModule.position[1] = Math.round(draggedModule.position[1] / 10) * 10;
	}

	ui.selectArea = [0, 0, 0, 0];

	localStorage.setItem('ui', JSON.stringify(window.ui));
});
