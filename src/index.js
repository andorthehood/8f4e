import pixijs from './ui/view/pixijs';

window.ui = {
	cursor: [0, 0],
	selectArea: [0, 0, 0, 0],
	modules: [
		{
			id: 1,
			name: 'Hello',
			position: [10, 10],
			size: [100, 100],
			zIndex: 1,
			draggableArea: [
				[0, 0],
				[100, 20],
			],
			beingDragged: false,
			connectors: [
				{ name: 'gate', id: 1, position: [5, 20] },
				{
					name: 'trigger',
					id: 2,
					position: [5, 40],
				},
			],
			isSelected: false,
		},
		{
			id: 2,
			name: 'Hello2',
			position: [60, 50],
			size: [100, 100],
			zIndex: 1,
			draggableArea: [
				[0, 0],
				[100, 20],
			],
			beingDragged: false,
			connectors: [
				{ name: 'gate', id: 1, position: [5, 20] },
				{
					name: 'trigger',
					id: 2,
					position: [5, 40],
				},
			],
			isSelected: false,
		},
		{
			id: 3,
			name: 'Hello2',
			position: [200, 200],
			size: [100, 100],
			zIndex: 1,
			draggableArea: [
				[0, 0],
				[100, 20],
			],
			beingDragged: false,
			connectors: [
				{ name: 'gate', id: 1, position: [5, 20] },
				{
					name: 'trigger',
					id: 2,
					position: [5, 40],
				},
								{
					name: 'trigger',
					id: 2,
					position: [5, 80],
				},
			],
			isSelected: false,
		},
		{
			id: 4,
			name: 'Hello',
			position: [10, 10],
			size: [100, 100],
			zIndex: 1,
			draggableArea: [
				[0, 0],
				[100, 20],
			],
			beingDragged: false,
			connectors: [
				{ name: 'gate', id: 1, position: [5, 20] },
				{
					name: 'trigger',
					id: 2,
					position: [5, 40],
				},
			],
			isSelected: false,
		},
		{
			id: 5,
			name: 'Hello2',
			position: [60, 50],
			size: [100, 100],
			zIndex: 1,
			draggableArea: [
				[0, 0],
				[100, 20],
			],
			beingDragged: false,
			connectors: [
				{ name: 'gate', id: 1, position: [5, 20] },
				{
					name: 'trigger',
					id: 2,
					position: [5, 40],
				},
			],
			isSelected: false,
		},
		{
			id: 6,
			name: 'Hello2',
			position: [60, 50],
			size: [100, 100],
			zIndex: 1,
			draggableArea: [
				[0, 0],
				[100, 20],
			],
			beingDragged: false,
			connectors: [
				{ name: 'gate', id: 1, position: [5, 20] },
				{
					name: 'trigger',
					id: 2,
					position: [5, 40],
				},
			],
			isSelected: false,
		},
	],
	connections: [
		{ fromModule: 1, fromConnector: 1, toModule: 3, toConnector: 2 },
		{ fromModule: 1, fromConnector: 0, toModule: 2, toConnector: 0 },
		{ fromModule: 2, fromConnector: 0, toModule: 3, toConnector: 1 },
		{ fromModule: 1, fromConnector: 1, toModule: 3, toConnector: 0 },
		{ fromModule: 2, fromConnector: 0, toModule: 4, toConnector: 0 },
		{ fromModule: 1, fromConnector: 1, toModule: 5, toConnector: 1 },
		{ fromModule: 2, fromConnector: 0, toModule: 6, toConnector: 1 },
	],
};

document.addEventListener('contextmenu', e => {
	e.preventDefault();
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
});

