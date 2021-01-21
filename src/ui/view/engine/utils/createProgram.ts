const createProgram = function (
	gl: WebGL2RenderingContext | WebGLRenderingContext,
	shaders: WebGLShader[]
): WebGLProgram {
	let program = gl.createProgram();

	shaders.forEach(shader => {
		console.log(shader);
		gl.attachShader(program, shader);
	});

	gl.linkProgram(program);

	const linked = gl.getProgramParameter(program, gl.LINK_STATUS);

	if (!linked) {
		const lastError = gl.getProgramInfoLog(program);
		console.error('Error in program linking: ' + lastError);
		gl.deleteProgram(program);
		return null;
	}

	return program;
};

export default createProgram;
