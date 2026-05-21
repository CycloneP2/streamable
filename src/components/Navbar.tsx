import { Link, useNavigate } from "@tanstack/react-router";
import { Film, Search, Sparkles, Menu, X, Download } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PROVIDERS } from "@/lib/api";
import { usePWA } from "@/hooks/use-pwa";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const { isInstallable, installApp } = usePWA();

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    setOpen(false);
    navigate({ to: "/search", search: { q: q.trim() } });
  };

  return (
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-4">
      <nav className="glass-strong mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-full px-3 py-2 sm:px-5 sm:py-2.5">
        <Link to="/" className="flex items-center gap-2 px-2">
          <div className="relative h-8 w-8 overflow-hidden rounded-xl">
            <div
              className="absolute inset-0"
              style={{
                background:
                  "conic-gradient(from 180deg, oklch(0.72 0.21 305), oklch(0.78 0.18 200), oklch(0.7 0.22 340), oklch(0.72 0.21 305))",
              }}
            />
            <Film className="absolute inset-0 m-auto h-4 w-4 text-white" />
          </div>
          <span className="text-base font-semibold tracking-tight sm:text-lg">
            Lumen<span className="text-gradient">.</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          <Link
            to="/"
            className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
            activeProps={{ className: "rounded-full px-3 py-1.5 text-sm bg-white/10 text-foreground" }}
            activeOptions={{ exact: true }}
          >
            Beranda
          </Link>
          {PROVIDERS.slice(0, 4).map((p) => (
            <Link
              key={p.id}
              to="/browse/$provider"
              params={{ provider: p.id }}
              className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
              activeProps={{ className: "rounded-full px-3 py-1.5 text-sm bg-white/10 text-foreground" }}
            >
              {p.name}
            </Link>
          ))}
          <Link
            to="/komik"
            className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
            activeProps={{ className: "rounded-full px-3 py-1.5 text-sm bg-white/10 text-foreground" }}
          >
            Komik
          </Link>
          <Link
            to="/ai"
            className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
            activeProps={{ className: "rounded-full px-3 py-1.5 text-sm bg-white/10 text-foreground" }}
          >
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> AI
            </span>
          </Link>
        </div>

        <form onSubmit={onSearch} className="hidden items-center md:flex">
          <div className="glass flex items-center gap-2 rounded-full px-3 py-1.5">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari film, drama, anime…"
              className="w-48 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
        </form>

        <button
          onClick={() => setOpen((v) => !v)}
          className="glass rounded-full p-2 md:hidden"
          aria-label="Menu"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>

        {isInstallable && (
          <button
            onClick={installApp}
            className="glass rounded-full p-2 transition hover:bg-white/20"
            title="Install app"
          >
            <Download className="h-4 w-4" />
          </button>
        )}
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-strong mx-auto mt-2 max-w-7xl rounded-3xl p-4 md:hidden"
          >
            <form onSubmit={onSearch} className="mb-3 flex items-center gap-2 glass rounded-full px-3 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cari…"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </form>
            <div className="grid grid-cols-2 gap-2">
              <Link
                to="/"
                onClick={() => setOpen(false)}
                className="glass rounded-2xl px-3 py-2 text-sm"
              >
                Beranda
              </Link>
              {PROVIDERS.map((p) => (
                <Link
                  key={p.id}
                  to="/browse/$provider"
                  params={{ provider: p.id }}
                  onClick={() => setOpen(false)}
                  className="glass rounded-2xl px-3 py-2 text-sm"
                >
                  {p.name}
                </Link>
              ))}
              <Link
                to="/komik"
                onClick={() => setOpen(false)}
                className="glass rounded-2xl px-3 py-2 text-sm"
              >
                Komik
              </Link>
              <Link
                to="/ai"
                onClick={() => setOpen(false)}
                className="glass rounded-2xl px-3 py-2 text-sm"
              >
                AI Chat
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
