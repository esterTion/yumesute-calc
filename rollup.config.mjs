import terser from '@rollup/plugin-terser'
import babel from '@rollup/plugin-babel';
// import { nodeResolve } from '@rollup/plugin-node-resolve';

import fs from 'fs'
function cleanMapBeforeBuild() {
  return {
    name: 'cleanMapBeforeBuild',
    buildStart() {
      let count = 0
      fs.readdirSync('./dist').forEach(file => {
        if (file.endsWith('.map')) {
          count++
          fs.unlinkSync(`./dist/${file}`)
        }
      })
      console.log(`cleaned ${count} sourcemap files`)
    }
  }
}

function copyStaticFiles() {
  const files = ['index.html', 'main.css']
  return {
    name: 'copyStaticFiles',
    buildEnd() {
      return Promise.all(files.map(file => (
        fs.promises.copyFile(`./${file}`, `./dist/${file}`)
      )))
    }
  }
}

export default [{
  input: 'src/main.js',
  output: {
    file: 'main-build.js',
    format: 'cjs',
    sourcemap: true,
    sourcemapFileNames: 'main-build.js.map'
  },
  plugins: [
    // nodeResolve(),
  ],
},{
  input: 'src/main.js',
  output: {
    file: 'dist/main-build.js',
    format: 'cjs',
    sourcemap: true,
    sourcemapFileNames: 'main-build.js.[hash].map'
  },
  plugins: [
    babel({ babelHelpers: 'bundled' }),
    terser(),
    cleanMapBeforeBuild(),
    copyStaticFiles(),
    // nodeResolve(),
  ],
}]
