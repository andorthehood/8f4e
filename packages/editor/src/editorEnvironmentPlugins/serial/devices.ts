import type { InfoRecord, State } from '@8f4e/editor-state-types';
import type { StateManager } from '@8f4e/state-manager';
import type { SerialNavigatorLike, SerialPortLike } from './types';

interface SerialDevicesOptions {
	store: StateManager<State>;
	navigator: Navigator;
	onPortsChanged?: () => void;
}

interface SerialPortRegistry {
	portsByIndex: Map<string, SerialPortLike>;
	indexesByPort: WeakMap<SerialPortLike, number>;
	nextIndex: number;
}

export interface SerialDeviceManager {
	getPort: (port: string) => SerialPortLike | undefined;
	dispose: () => void;
}

function getSerialNavigator(navigator: Navigator): SerialNavigatorLike | undefined {
	return (navigator as unknown as { serial?: SerialNavigatorLike }).serial;
}

function formatHexId(value: number | undefined, fallback: string): string {
	if (value === undefined) {
		return fallback;
	}

	return `0x${value.toString(16).padStart(4, '0')}`;
}

function formatPortName(port: SerialPortLike, fallback: string): string {
	const info = port.getInfo?.();
	if (!info) {
		return `Serial port ${fallback}`;
	}

	const vendor = formatHexId(info.usbVendorId, 'unknown');
	const product = formatHexId(info.usbProductId, 'unknown');

	return `USB ${vendor}:${product}`;
}

function getPortIndex(port: SerialPortLike, registry: SerialPortRegistry): string {
	let index = registry.indexesByPort.get(port);
	if (index === undefined) {
		index = registry.nextIndex++;
		registry.indexesByPort.set(port, index);
	}

	return String(index);
}

function createSerialInfo(ports: SerialPortLike[], registry: SerialPortRegistry): InfoRecord {
	registry.portsByIndex.clear();

	const info: InfoRecord = {};
	for (const port of ports) {
		const index = getPortIndex(port, registry);
		info[index] = formatPortName(port, index);
		registry.portsByIndex.set(index, port);
	}

	return info;
}

export default function createSerialDeviceManager({
	store,
	navigator,
	onPortsChanged,
}: SerialDevicesOptions): SerialDeviceManager {
	const serial = getSerialNavigator(navigator);
	const registry: SerialPortRegistry = {
		portsByIndex: new Map(),
		indexesByPort: new WeakMap(),
		nextIndex: 0,
	};
	let disposed = false;
	let refreshGeneration = 0;

	function setSerialInfo(info: InfoRecord | undefined): void {
		store.set('info.serial', info);
	}

	function refreshPorts(): void {
		if (disposed || typeof serial?.getPorts !== 'function') {
			return;
		}

		const generation = ++refreshGeneration;
		void serial
			.getPorts()
			.then(ports => {
				if (disposed || generation !== refreshGeneration) {
					return;
				}

				setSerialInfo(createSerialInfo(ports, registry));
				onPortsChanged?.();
			})
			.catch(() => {
				if (disposed || generation !== refreshGeneration) {
					return;
				}

				registry.portsByIndex.clear();
				setSerialInfo({});
				onPortsChanged?.();
			});
	}

	if (typeof serial?.getPorts !== 'function') {
		setSerialInfo({});
		return {
			getPort: () => undefined,
			dispose: () => {
				disposed = true;
				setSerialInfo(undefined);
				onPortsChanged?.();
			},
		};
	}

	const handlePortChange = () => refreshPorts();
	serial.addEventListener?.('connect', handlePortChange);
	serial.addEventListener?.('disconnect', handlePortChange);

	setSerialInfo({});
	refreshPorts();

	return {
		getPort: port => registry.portsByIndex.get(port),
		dispose: () => {
			disposed = true;
			refreshGeneration++;
			serial.removeEventListener?.('connect', handlePortChange);
			serial.removeEventListener?.('disconnect', handlePortChange);
			registry.portsByIndex.clear();
			setSerialInfo(undefined);
			onPortsChanged?.();
		},
	};
}
