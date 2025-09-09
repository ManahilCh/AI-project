import { SiteHeader } from "./SiteHeader";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        {children}
      </main>
      <footer className="border-t py-6 text-sm text-muted-foreground">
        <div className="container flex items-center justify-between">
          <span>© {new Date().getFullYear()} AI Metric FSD</span>
          <span className="hidden sm:block">Powered by AI Metric FSD</span>
        </div>
      </footer>
    </div>
  );
}
