import process from 'node:process'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const child = spawn(process.execPath, [
  fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url)),
  '--host', '127.0.0.1', '--port', '5174', '--strictPort',
], {
  cwd: fileURLToPath(new URL('..', import.meta.url)),
  env: { ...process.env, APIARY_PREVIEW: '1' },
  stdio: 'inherit',
})
child.on('exit', (code) => process.exit(code ?? 1))
