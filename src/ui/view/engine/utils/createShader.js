const createShader = function (gl, shaderSource, shaderType) {
	const shader = gl.createShader(shaderType);
	gl.shaderSource(shader, shaderSource);
	gl.compileShader(shader);

	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		const info = gl.getShaderInfoLog(shader);
		console.error('Could not compile web gl shader', info);
	}

	return shader;
};

export default createShader;
