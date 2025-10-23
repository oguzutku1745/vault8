// @ts-nocheck
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    // Prefer .ts over .js when both are present to favor ESM TS sources in generated folders
    extensions: ['.mjs', '.ts', '.js', '.jsx', '.tsx', '.json'],
    alias: [
      // ====== Path Aliases for shadcn/ui components ======
      {
        find: '@',
        replacement: path.resolve(__dirname, './src'),
      },
      // Map phosphor icon subpath imports to the actual dist icons directory
      {
        find: /^@phosphor-icons\/webcomponents\/(.*)$/,
        replacement: path.resolve(__dirname, 'node_modules/@phosphor-icons/webcomponents/dist/icons') + '/$1.mjs',
      },
      // ensure the package root still resolves to its ESM bundle
      {
        find: '@phosphor-icons/webcomponents',
        replacement: path.resolve(__dirname, 'node_modules/@phosphor-icons/webcomponents/dist/index.mjs'),
      },
      // Redirect imports that would resolve to compiled generated my_oapp JS
      // to the ESM-friendly TS sources. Match a few common resolution forms
      // (with or without trailing index.js).
      {
        find: /\/lib\/client\/generated\/my_oapp\/errors(?:\/index)?(?:\.js)?$/,
        replacement: path.resolve(__dirname, 'lib/client/generated/my_oapp/errors/myOapp.ts'),
      },
      {
        find: /\/lib\/client\/generated\/my_oapp(?:\/index)?(?:\.js)?$/,
        replacement: path.resolve(__dirname, 'lib/client/generated/my_oapp/esm-index.ts'),
      },
      // Force submodule folders to resolve to their TS index files (avoid CJS barrels)
      {
        find: /\/lib\/client\/generated\/my_oapp\/types(?:\/index)?(?:\.js)?$/,
        replacement: path.resolve(__dirname, 'lib/client/generated/my_oapp/types/index.ts'),
      },
      {
        find: /\/lib\/client\/generated\/my_oapp\/accounts(?:\/index)?(?:\.js)?$/,
        replacement: path.resolve(__dirname, 'lib/client/generated/my_oapp/accounts/index.ts'),
      },
      {
        find: /\/lib\/client\/generated\/my_oapp\/instructions(?:\/index)?(?:\.js)?$/,
        replacement: path.resolve(__dirname, 'lib/client/generated/my_oapp/instructions/index.ts'),
      },
      {
        find: /\/lib\/client\/generated\/my_oapp\/shared(?:\/index)?(?:\.js)?$/,
        replacement: path.resolve(__dirname, 'lib/client/generated/my_oapp/shared/index.ts'),
      },
      {
        find: /\/lib\/client\/generated\/my_oapp\/programs\/myOapp(?:\.js)?$/,
        replacement: path.resolve(__dirname, 'lib/client/generated/my_oapp/programs/myOapp.ts'),
      },
      // Map relative imports used inside generated files to TS ESM sources.
      // Note: use regexes that match within the generated directory context.
      {
        find: /lib\/client\/generated\/my_oapp\/.*\/\.\.\/types$/,
        replacement: path.resolve(__dirname, 'lib/client/generated/my_oapp/types/index.ts'),
      },
      {
        find: /lib\/client\/generated\/my_oapp\/.*\/\.\.\/shared$/,
        replacement: path.resolve(__dirname, 'lib/client/generated/my_oapp/shared/index.ts'),
      },
      {
        find: /lib\/client\/generated\/my_oapp\/.*\/\.\.\/accounts$/,
        replacement: path.resolve(__dirname, 'lib/client/generated/my_oapp/accounts/index.ts'),
      },
      {
        find: /lib\/client\/generated\/my_oapp\/.*\/\.\.\/instructions$/,
        replacement: path.resolve(__dirname, 'lib/client/generated/my_oapp/instructions/index.ts'),
      },
      // Also map direct runtime requests to '/client/generated/my_oapp' to the
      // ESM sources under ./client so the dynamic import in the app prefers
      // the client TS files when present.
      {
        find: /\/client\/generated\/my_oapp(?:\/index)?(?:\.js)?$/,
        replacement: path.resolve(__dirname, 'lib/client/generated/my_oapp/esm-index.ts'),
      },
      // Polyfill some Node builtins used by transitive dependencies in the browser
  // Provide a 'process' alias to the browser polyfill so modules that
  // read process.version or call process.nextTick don't crash.
  { find: 'process', replacement: path.resolve(__dirname, 'node_modules/process/browser.js') },
  { find: 'util', replacement: path.resolve(__dirname, 'node_modules/util/util.js') },
  { find: 'buffer', replacement: path.resolve(__dirname, 'node_modules/buffer/index.js') },
  // Use stream-browserify which provides an entry that esbuild can read in
  // the browser and is a common drop-in for Node's stream module.
  { find: 'stream', replacement: path.resolve(__dirname, 'node_modules/stream-browserify/index.js') },
  { find: 'stream/consumers', replacement: path.resolve(__dirname, 'node_modules/stream-browserify/index.js') },
  { find: 'crypto', replacement: path.resolve(__dirname, 'node_modules/crypto-browserify/index.js') },
    ],
  },
  define: {
    'process.env': {},
  },
})
