import { Connection, Connector, Module } from '../types';

export default function findConnectionByConnector(connections: Connection[], module: Module, connector: Connector) {
	return state.ui.connections.find(({ fromModule, toModule, fromConnector, toConnector }) => {
		return (
			(fromModule === module.id && fromConnector === connector.id) ||
			(toModule === module.id && toConnector === connector.id)
		);
	});
}
