import terser from '@rollup/plugin-terser'

import fs from 'fs'
function cleanMapBeforeBuild() {
	return {
		name: 'cleanMapBeforeBuild',
		buildStart() {
			let count = 0
			fs.readdirSync('./').forEach(file => {
				if (file.endsWith('.map')) {
					count++
					fs.unlinkSync(file)
				}
			})
			console.log(`cleaned ${count} sourcemap files`)
		}
	}
}

export default {
	input: 'src/main.js',
	output: {
		file: 'main-build.js',
		format: 'cjs',
		sourcemap: true,
		sourcemapFileNames: 'main-build.js.[hash].map'
	},
	plugins: [
		terser(),
		cleanMapBeforeBuild(),
	],
}