// Import Tailwind CSS and animations
import './index.css'

// Guarded dynamic boot: attempt to import React and App, display any errors on-page
async function boot() {
  // Provide a few small runtime polyfills for libs that expect Node builtins.
  try {
    // Some Node-legacy libs check `process.version` or `process.browser`.
    // Provide a tiny shim so they don't throw when run in the browser.
    // Keep it minimal and non-enumerable to avoid interfering with other code.
    try {
      if (typeof (window as any).process === 'undefined') {
        Object.defineProperty(window, 'process', {
          value: {
            browser: true,
            // A stable semver-like prefix used by some libs when checking
            // process.version.slice(0, 5).
            version: 'v20.19.5',
            // Provide a lightweight nextTick fallback for packages that
            // call process.nextTick in browser bundles.
            nextTick: function (cb: (...args: any[]) => void, ...args: any[]) {
              return setTimeout(function () {
                try {
                  cb.apply(null, args)
                } catch (e) {
                  setTimeout(function () {
                    throw e
                  }, 0)
                }
              }, 0)
            },
          },
        })
      }
    } catch (e) {
      // ignore shim failures
    }
  // Buffer
  const { Buffer } = await import('buffer')
    // @ts-ignore
    if ((window as any).Buffer === undefined) (window as any).Buffer = Buffer
    // crypto
    try {
      const crypto = await import('crypto-browserify')
      // @ts-ignore
      if ((window as any).crypto === undefined) (window as any).crypto = crypto.default || crypto
    } catch (e) {
      // optional
    }
  } catch (e) {
    console.warn('polyfill load failed', e)
  }
  function showPageError(msg: string) {
    try {
      let el = document.getElementById('boot-error')
      if (!el) {
        el = document.createElement('div')
        el.id = 'boot-error'
        el.style.position = 'fixed'
        el.style.left = '8px'
        el.style.right = '8px'
        el.style.top = '8px'
        el.style.padding = '12px'
        el.style.background = 'rgba(255,0,0,0.95)'
        el.style.color = 'white'
        el.style.zIndex = '99999'
        el.style.fontFamily = 'monospace'
        el.style.whiteSpace = 'pre-wrap'
        el.style.maxHeight = '60vh'
        el.style.overflow = 'auto'
        document.body.appendChild(el)
      }
      el.textContent = msg
    } catch (e) {
      console.error('failed to show boot error', e)
    }
  }

  try {
    console.log('[frontend] main.tsx - guarded boot: importing React & App')
    const [{ createRoot }, ReactModule, AppModule] = await Promise.all([
      import('react-dom/client'),
      import('react'),
      import('./App'),
    ])
    const Root = createRoot(document.getElementById('root')!)
    Root.render(ReactModule.createElement(AppModule.default))
    console.log('[frontend] React App rendered')
  } catch (err: any) {
    console.error('[frontend] boot error', err)
    showPageError(String(err.stack || err))
  }
}

boot()
