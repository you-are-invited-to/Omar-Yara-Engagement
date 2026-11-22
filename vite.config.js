import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Build-time Open Graph & SEO meta tag replacement per customer repository (CFG-001)
const customerMetaHtmlPlugin = (env) => ({
  name: 'customer-meta-html-transform',
  transformIndexHtml(html) {
    let out = html
    const ogTitle = env.VITE_OG_TITLE || process.env.VITE_OG_TITLE
    const ogDesc = env.VITE_OG_DESCRIPTION || process.env.VITE_OG_DESCRIPTION
    const siteUrl = env.VITE_SITE_URL || process.env.VITE_SITE_URL
    const ogImg = env.VITE_OG_IMAGE || process.env.VITE_OG_IMAGE

    if (ogTitle) {
      const safeTitle = ogTitle.replace(/"/g, '&quot;')
      out = out.replace(/<title>.*?<\/title>/, `<title>${safeTitle}</title>`)
      out = out.replace(/(property="og:title" content=").*?(")/, `$1${safeTitle}$2`)
      out = out.replace(/(name="twitter:title" content=").*?(")/, `$1${safeTitle}$2`)
    }
    if (ogDesc) {
      const safeDesc = ogDesc.replace(/"/g, '&quot;')
      out = out.replace(/(name="description" content=").*?(")/, `$1${safeDesc}$2`)
      out = out.replace(/(property="og:description" content=").*?(")/, `$1${safeDesc}$2`)
      out = out.replace(/(name="twitter:description" content=").*?(")/, `$1${safeDesc}$2`)
    }
    if (siteUrl) {
      const safeUrl = siteUrl.replace(/"/g, '&quot;')
      out = out.replace(/(property="og:url" content=").*?(")/, `$1${safeUrl}$2`)
    }
    if (ogImg) {
      const safeImg = ogImg.replace(/"/g, '&quot;')
      out = out.replace(/(property="og:image" content=").*?(")/, `$1${safeImg}$2`)
      out = out.replace(/(name="twitter:image" content=").*?(")/, `$1${safeImg}$2`)
    }
    return out
  },
})

export default defineConfig(({ mode, command }) => {
  // Load .env files + OS process.env so both local `npm run deploy` and GitHub Actions work identically
  const env = loadEnv(mode, process.cwd(), '')

  // Parameterized Base Path (ARC-003, CFG-009, ISO-003):
  // Each customer repository can define VITE_BASE_PATH (e.g. '/invite-customer-a/' or '/' for custom domain).
  // Falls back to '/invitation/' in production builds for backward compatibility with the default repo.
  const isProd = mode === 'production' || command === 'build' || process.env.NODE_ENV === 'production' || env.GITHUB_PAGES === 'true'
  const base = env.VITE_BASE_PATH || process.env.VITE_BASE_PATH || (isProd ? '/invitation/' : '/')

  return {
    plugins: [react(), customerMetaHtmlPlugin(env)],
    base,
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('node_modules/framer-motion')) {
              return 'framer-motion';
            }
            if (id.includes('node_modules/i18next') || id.includes('node_modules/react-i18next')) {
              return 'i18n';
            }
          },
        },
      },
    },
  }
})
