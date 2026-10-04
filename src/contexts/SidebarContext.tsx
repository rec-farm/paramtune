import { createContext, useContext, useState, ReactNode } from 'react'

export class SidebarContextError extends Error {
  constructor() {
    super('useSidebar must be used within a SidebarProvider')
    this.name = 'SidebarContextError'
  }
}

type SidebarContextType = {
  isOpen: boolean
  toggle: () => void
  open: () => void
  close: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const toggle = () => setIsOpen((prev) => !prev)
  const open = () => setIsOpen(true)
  const close = () => setIsOpen(false)

  return (
    <SidebarContext.Provider value={{ isOpen, toggle, open, close }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new SidebarContextError()
  }
  return context
}

export function useSidebarSafe() {
  const context = useContext(SidebarContext)
  return context
}
