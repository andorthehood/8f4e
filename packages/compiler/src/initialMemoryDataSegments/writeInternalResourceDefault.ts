import type { InternalResource } from '@8f4e/compiler-types';

export default function writeInternalResourceDefault(view: DataView, resource: InternalResource) {
	if (resource.storageType === 'float64') {
		view.setFloat64(resource.byteAddress, resource.default, true);
		return;
	}

	if (resource.storageType === 'float') {
		view.setFloat32(resource.byteAddress, resource.default, true);
		return;
	}

	view.setInt32(resource.byteAddress, Math.trunc(resource.default), true);
}
