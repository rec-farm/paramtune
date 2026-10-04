import { readdir, stat } from 'node:fs/promises'

const directory = 'dist/client/assets'
const assets = await Promise.all((await readdir(directory)).map(async (name) => ({ name, bytes: (await stat(`${directory}/${name}`)).size })))
console.table(assets.filter(({ name }) => /\.(js|css)$/.test(name)).sort((a, b) => b.bytes - a.bytes))
