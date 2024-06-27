import terser from '@rollup/plugin-terser'
import babel from '@rollup/plugin-babel';

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
    babel({ babelHelpers: 'bundled' }),
    terser(),
    cleanMapBeforeBuild(),
  ],
}
