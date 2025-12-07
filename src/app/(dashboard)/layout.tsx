export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-8 max-w-7xl mx-auto">
        {children}
      </div>
    </div>
  )
}
