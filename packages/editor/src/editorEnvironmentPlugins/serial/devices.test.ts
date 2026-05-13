import { describe, expect, it, vi } from 'vitest';
import createStateManager from '@8f4e/state-manager';

import createSerialDeviceManager from './devices';

import type { State } from '@8f4e/editor-state-types';
import type { SerialNavigatorLike, SerialPortLike } from './types';

function createStore() {
	return createStateManager({
		info: {},
	} as unknown as State);
}

async function flushPromises(): Promise<void> {
	await Promise.resolve();
	await Promise.resolve();
}

describe('createSerialDeviceManager', () => {
	it('commits an empty serial device list when Web Serial is unavailable', () => {
		const store = createStore();
		const manager = createSerialDeviceManager({ store, navigator: {} as Navigator });

		expect(store.getState().info.serial).toEqual({});

		manager.dispose();

		expect(store.getState().info.serial).toBeUndefined();
	});

	it('commits already-granted serial ports into state.info.serial', async () => {
		const store = createStore();
		const portA: SerialPortLike = {
			open: vi.fn(),
			getInfo: () => ({ usbVendorId: 0x2341, usbProductId: 0x0043 }),
		};
		const portB: SerialPortLike = {
			open: vi.fn(),
		};
		let ports = [portA];
		let connectHandler: ((event: Event) => void) | undefined;
		const serial: SerialNavigatorLike = {
			getPorts: vi.fn(async () => ports),
			addEventListener: vi.fn((type, handler) => {
				if (type === 'connect') {
					connectHandler = handler;
				}
			}),
			removeEventListener: vi.fn(),
		};
		const manager = createSerialDeviceManager({
			store,
			navigator: { serial } as unknown as Navigator,
		});

		expect(store.getState().info.serial).toEqual({});

		await flushPromises();

		expect(store.getState().info.serial).toEqual({
			'0': 'USB 0x2341:0x0043',
		});
		expect(manager.getPort('0')).toBe(portA);

		ports = [portA, portB];
		connectHandler?.({} as Event);
		await flushPromises();

		expect(store.getState().info.serial).toEqual({
			'0': 'USB 0x2341:0x0043',
			'1': 'Serial port 1',
		});
		expect(manager.getPort('1')).toBe(portB);

		manager.dispose();

		expect(store.getState().info.serial).toBeUndefined();
		expect(serial.removeEventListener).toHaveBeenCalledWith('connect', expect.any(Function));
		expect(serial.removeEventListener).toHaveBeenCalledWith('disconnect', expect.any(Function));
	});
});
