import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto max-w-4xl flex h-15 items-center px-4 justify-between py-3">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary hover:text-primary/80 transition-colors">
            <span role="img" aria-label="Cloud text-2xl">☁️</span>
            <span>Cloud Architect AI</span>
          </Link>
        </div>
        <nav className="flex items-center gap-6 text-sm font-medium text-secondary">
          <Link href="/" className="transition-colors hover:text-foreground">
            Gerar
          </Link>
          <Link href="/history" className="transition-colors hover:text-foreground">
            Histórico
          </Link>
        </nav>
      </div>
    </header>
  );
}
