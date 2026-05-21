import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { Navbar } from "@/components/Navbar";
import { LiquidBackground } from "@/components/LiquidBackground";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass-strong max-w-md rounded-3xl p-8 text-center">
        <h1 className="text-7xl font-bold text-gradient">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Halaman tidak ditemukan</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Halaman yang kamu cari mungkin sudah dipindah atau tidak ada.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
        >
          Kembali ke beranda
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass-strong max-w-md rounded-3xl p-8 text-center">
        <h1 className="text-xl font-semibold">Halaman gagal dimuat</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
          >
            Coba lagi
          </button>
          <a href="/" className="glass rounded-full px-5 py-2 text-sm">Beranda</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "Sansekai — Nonton Film, Drama & Anime" },
      { name: "description", content: "Streaming film, drama pendek, dan anime gratis dengan tampilan iOS 26 Liquid Glass." },
      { name: "theme-color", content: "#0f172a" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "Sansekai" },
      { name: "mobile-web-app-capable", content: "yes" },
      { property: "og:title", content: "Sansekai — Streaming Liquid Glass" },
      { property: "og:description", content: "Nonton film, drama, dan anime dalam UI iOS 26 Liquid Glass." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://sansekai.vercel.app" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Sansekai — Streaming" },
      { name: "twitter:description", content: "Nonton film, drama, dan anime gratis" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "icon", href: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 192 192'%3E%3Crect fill='%230f172a' width='192' height='192'/%3E%3Crect fill='%2360a5fa' x='48' y='48' width='96' height='96' rx='20'/%3E%3Ctext x='96' y='96' font-size='80' fill='%230f172a' text-anchor='middle' dominant-baseline='middle' font-weight='bold'%3ES%3C/text%3E%3C/svg%3E" },
      { rel: "apple-touch-icon", href: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 180 180'%3E%3Crect fill='%230f172a' width='180' height='180'/%3E%3Crect fill='%2360a5fa' x='45' y='45' width='90' height='90' rx='20'/%3E%3Ctext x='90' y='90' font-size='72' fill='%230f172a' text-anchor='middle' dominant-baseline='middle' font-weight='bold'%3ES%3C/text%3E%3C/svg%3E" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <LiquidBackground />
      <Navbar />
      <main className="mx-auto max-w-7xl pb-24">
        <Outlet />
      </main>
      <footer className="px-6 pb-10 pt-6 text-center text-xs text-muted-foreground">
        Powered by{" "}
        <a href="https://api.sansekai.my.id" className="underline">
          Sansekai API
        </a>{" "}
        • UI ✦ Lumen Liquid Glass
      </footer>
    </QueryClientProvider>
  );
}
