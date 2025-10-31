import Sidebar from '@/components/Sidebar'
import { getPlatforms } from '@/models/Platform'
import { SidebarProvider } from '@/contexts/SidebarContext'

type PageProps = {
  children: React.ReactNode
}

export default async function DashboardLayout({ children }: PageProps) {
  const platforms = await getPlatforms()

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar platforms={platforms} />
        <main className="flex-1 min-h-screen">
          <div className="p-4 md:p-6">
            <div className="animate-in">{children}</div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
