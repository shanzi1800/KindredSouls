import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// ── E42+ 45-D2 先锋战：城市库内容指纹（供 immutable 强缓存的 URL 版本令牌）──
// 病根：/data/cities.json 6.9MB 明文裸传 + `max-age=0`（连缓存都没有）⇒ 首可用 31~56s。
// 治法：预压缩（见 scripts/precompress-data.mjs）+ 服务端 immutable 强缓存；
//       强缓存必须配「内容指纹 URL」否则升级城市库后老用户被旧缓存永久钉死。
// 取 sha256 前 12 位 ⇒ 内容变 ⇒ URL 变 ⇒ 自动穿透。读不到（首次/缺资产）⇒ 'dev'（不阻断构建）。
const _dirname = path.dirname(fileURLToPath(import.meta.url))
function citiesVersion(): string {
  try {
    const p = path.resolve(_dirname, 'public', 'data', 'cities.json')
    if (!existsSync(p)) return 'dev'
    return createHash('sha256').update(readFileSync(p)).digest('hex').slice(0, 12)
  } catch {
    return 'dev'
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __CITIES_VERSION__: JSON.stringify(citiesVersion()),
  },
  build: {
    cssMinify: false,
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name]-[hash]-${Date.now()}.js`,
        chunkFileNames: `assets/[name]-[hash]-${Date.now()}.js`,
        assetFileNames: `assets/[name]-[hash]-${Date.now()}.[ext]`,
      },
    },
  },
  server: {
    proxy: {
      // 开发时: /api → Express server
      '/api': {
        target: 'https://kindredsouls-production.up.railway.app',
        changeOrigin: true,
      },
    },
  },
})
