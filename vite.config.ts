import {defineConfig} from 'vite'
import Vue from '@vitejs/plugin-vue'
import VueJsx from "@vitejs/plugin-vue-jsx";
import {resolve} from 'path'
import {visualizer} from "rollup-plugin-visualizer";
import SlidePlugin from './src/components/slide/data.js';
import {getLastCommit} from "git-last-commit";
import UnoCSS from 'unocss/vite'
import VueMacros from 'unplugin-vue-macros/vite'
import Icons from 'unplugin-icons/vite'
import Components from 'unplugin-vue-components/vite'
import IconsResolver from 'unplugin-icons/resolver'

function pathResolve(dir: string) {
  return resolve(__dirname, ".", dir)
}

const lifecycle = process.env.npm_lifecycle_event;

// https://vitejs.dev/config/
export default defineConfig(() => {
  return new Promise(resolve => {
    let latestCommitHash = ''
    getLastCommit((err, commit) => {
      if (!err) latestCommitHash = commit.shortHash
      resolve({
        plugins: [
          Icons({
            autoInstall: true,
            compiler: 'vue3',
          }),
          Components({
            resolvers: [
              IconsResolver({
                prefix: 'Icon',
              }),
            ],
          }),
          VueMacros({
            plugins: {
              vue: Vue(),
              vueJsx: VueJsx(),
            },
          }),
          UnoCSS(),
          lifecycle === 'report' ?
            visualizer({
              gzipSize: true,
              brotliSize: true,
              emitFile: false,
              filename: "report.html",
              open: true
            }) : null,
          SlidePlugin(),
          // 【关键修改】这里删除了 inject-cdn-head 和 viteExternalsPlugin
        ],
        build: {
          rollupOptions: {
            output: {
              manualChunks(id) {
                if (id.includes('node_modules/@iconify') || id.includes('~icons')) {
                  return 'icons';
                }
                if (id.includes('utils') || id.includes('hooks')) {
                  return 'utils'
                }
                // 这里移除了 isCdnBuild 的判断，让它在任何情况下都正常分包
                if (id.includes('dialog')) {
                  return 'dialog'
                }
              }
            }
          }
        },
        define: {
          LATEST_COMMIT_HASH: JSON.stringify(latestCommitHash + (process.env.NODE_ENV === 'production' ? '' : ' (dev)')),
        },
        base: '/',
        resolve: {
          alias: {
            "@": pathResolve("src"),
          },
          extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue']
        },
        css: {
          preprocessorOptions: {
            scss: {
              api: "modern-compiler"
            }
          }
        },
        server: {
          port: 3000,
          open: false,
          host: '0.0.0.0',
          fs: {
            strict: false,
          },
          proxy: {
            '/baidu': 'https://api.fanyi.baidu.com/api/trans/vip/translate'
          }
        }
      })
    })
  })
})
