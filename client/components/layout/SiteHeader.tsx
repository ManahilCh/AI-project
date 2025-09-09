import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Sun, MoonStar } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const NavLink = ({ to, children }: { to: string; children: React.ReactNode }) => {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <Link
      to={to}
      className={cn(
        "px-3 py-2 rounded-md text-sm font-medium transition-colors",
        active
          ? "bg-secondary text-secondary-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-muted",
      )}
    >
      {children}
    </Link>
  );
};

export function SiteHeader() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const current = theme === "system" ? systemTheme : theme;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-animated-gradient" />
            <span className="text-base sm:text-lg font-extrabold tracking-tight">AI Metric FSD</span>
          </Link>
          <nav className="ml-4 hidden md:flex items-center gap-1">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/upload">Upload</NavLink>
            <NavLink to="/dashboard">Dashboard</NavLink>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label="Toggle Theme"
            onClick={() => setTheme((current === "dark" ? "light" : "dark") as any)}
          >
            {mounted && current === "dark" ? <Sun className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
          </Button>
          <div className="md:hidden">
            <NavLink to="/upload">Upload</NavLink>
          </div>
        </div>
      </div>
    </header>
  );
}
