import type { DataStructure } from '@8f4e/compiler-types';

export default function writeDefaultValue(
	view: DataView,
	memory: Pick<DataStructure, 'isInteger' | 'isUnsigned' | 'elementWordSize'>,
	byteAddress: number,
	value: number
) {
	if (memory.isInteger && memory.elementWordSize === 1) {
		if (memory.isUnsigned) {
			view.setUint8(byteAddress, Math.trunc(value));
		} else {
			view.setInt8(byteAddress, Math.trunc(value));
		}
		return;
	}

	if (memory.isInteger && memory.elementWordSize === 2) {
		if (memory.isUnsigned) {
			view.setUint16(byteAddress, Math.trunc(value), true);
		} else {
			view.setInt16(byteAddress, Math.trunc(value), true);
		}
		return;
	}

	if (memory.elementWordSize === 8 && !memory.isInteger) {
		view.setFloat64(byteAddress, value, true);
		return;
	}

	if (memory.isInteger) {
		view.setInt32(byteAddress, Math.trunc(value), true);
		return;
	}

	view.setFloat32(byteAddress, value, true);
}
