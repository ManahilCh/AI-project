"use client";
import Link from "next/link";
import { Button } from "./ui/button";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { MoonStar, Sun } from "lucide-react";
import { cn } from "./utils";
import { usePathname } from "next/navigation";

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link href={href} className={cn("px-3 py-2 rounded-md text-sm font-medium transition-colors", active ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted")}>{children}</Link>
  );
}

export function SiteHeader() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const current = theme === "system" ? systemTheme : theme;
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-animated-gradient" />
            <span className="text-base sm:text-lg font-extrabold tracking-tight">AI Metric FSD</span>
          </Link>
          <nav className="ml-4 hidden md:flex items-center gap-1">
            <NavLink href="/">Home</NavLink>
            <NavLink href="/upload">Upload</NavLink>
            <NavLink href="/dashboard">Dashboard</NavLink>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Button aria-label="Toggle Theme" variant="outline" size="icon" onClick={() => setTheme((current === "dark" ? "light" : "dark") as any)}>
            {mounted && current === "dark" ? <Sun className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </header>
  );
}
