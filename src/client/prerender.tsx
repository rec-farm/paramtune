import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import Home from '@/client/pages/Home'
import ApiDocs from '@/client/pages/ApiDocs'

export function render(path: string) {
  return renderToString(<MemoryRouter initialEntries={[path]}>{path === '/' ? <Home /> : <ApiDocs />}</MemoryRouter>)
}
