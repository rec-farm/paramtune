import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { render } from '../dist/prerender/render.js'

const template = await readFile('dist/client/index.html', 'utf8')
await writeFile('dist/client/app.html', template)
for (const path of ['/', '/api-docs']) {
  const directory = `dist/client${path}`
  await mkdir(directory, { recursive: true })
  await writeFile(`${directory}/index.html`, template.replace('<div id="root"></div>', `<div id="root">${render(path)}</div>`))
}
