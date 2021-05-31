import * as moduleTypes from '../../modules';
import { Module } from '../types';

export default function findConnectorInModule(modules: Module[], moduleId: string, connectorId: string) {
	const { type } = modules.find(({ id }) => id === moduleId);
	// @TODO improve performance
	return [...moduleTypes[type].inputs, ...moduleTypes[type].outputs].find(({ id }) => id === connectorId);
}
