const setUniform = function (gl, program, name, ...values) {
	const location = gl.getUniformLocation(program, name);
	gl['uniform' + values.length + 'f'](location, ...values);
};

export default setUniform;
