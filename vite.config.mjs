import { defineConfig } from 'vite'
import glsl from 'vite-plugin-glsl'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    glsl({
      include: ['**/*.glsl', '**/*.vert', '**/*.frag'],
      defaultExtension: 'glsl',
      warnDuplicatedImports: true,
      watch: true
    }),
    viteStaticCopy({
      targets: [
        {
          src: 'src/_headers',
          dest: ''
        }
      ]
    })
  ],
  build: {
    outDir: 'dist'
  },
  publicDir: false, // Don't copy public dir since we need specific handling
  server: {
    port: 3000,
    hmr: {
      port: 30000
    },
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin'
    }
  }
})