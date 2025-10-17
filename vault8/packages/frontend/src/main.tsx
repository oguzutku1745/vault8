// Guarded dynamic boot: attempt to import React and App, display any errors on-page
async function boot() {
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
