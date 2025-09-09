import "./globals.css";
import { ThemeProvider } from "../components/theme-provider";
import { SiteHeader } from "../components/site-header";

export const metadata = {
  title: "AI Metric FSD Result Predictor (2021–2025)",
  description: "Modern, animated, AI-powered results dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <div className="min-h-screen flex flex-col">
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <footer className="border-t py-6 text-sm text-muted-foreground">
              <div className="container mx-auto flex items-center justify-between px-4">
                <span>© {new Date().getFullYear()} AI Metric FSD</span>
                <span className="hidden sm:block">Powered by AI Metric FSD</span>
              </div>
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
