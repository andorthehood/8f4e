import saw from './compiler/modules/saw';
import utils from './compiler/wasm/utils';


const runTests = async function () {
	try {
		await saw();
		utils();
		console.log('%c test success', 'color: #00ff00');
	} catch(e) {
		console.log(e)
	}
};

export default runTests;
