import { Footer } from "@/components/footer";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col gap-4 p-4 md:p-8 max-w-7xl mx-auto w-full">
        {children}
      </div>
      <Footer />
    </div>
  )
}
