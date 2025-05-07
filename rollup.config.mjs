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
  return {
    name: 'copyStaticFiles',
    buildEnd() {
      return Promise.all([
        fs.promises.copyFile(`./main.css`, `./dist/main.css`),
        (async () => {
          const fileVer = {
            main_css: await fs.promises.stat(`./main.css`).then(stats => stats.mtimeMs),
            main_js: Date.now()
          }
          let content = await fs.promises.readFile(`./index.html`, 'utf-8')
          content = content.replace(/{ver\.([^}]+)}/g, (_, key) => (t=>{
            if (!t) return ''
            t = new Date(t)
            return t.toLocaleDateString('zh-CN', {year: 'numeric',month: '2-digit',day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false}).replace(/[/:]/g, '').replace(' ', '_')
          })(fileVer[key]))
          return fs.promises.writeFile(`./dist/index.html`, content)
        })()
      ])
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
