const findConnectionByConnector = function (state, module, connector) {
	return state.ui.connections.find(({ fromModule, toModule, fromConnector, toConnector }) => {
		return (
			(fromModule === module.id && fromConnector === connector.id) ||
			(toModule === module.id && toConnector === connector.id)
		);
	});
};
export default findConnectionByConnector;
