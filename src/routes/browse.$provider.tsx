import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { api, PROVIDERS, type Provider } from "@/lib/api";
import { normalize, pickList } from "@/lib/normalize";
import { MovieCard } from "@/components/MovieCard";
import { Section } from "@/components/Section";

export const Route = createFileRoute("/browse/$provider")({
  component: BrowsePage,
});

type Tab = { key: string; label: string; fn: () => Promise<any> };

function getTabs(provider: Provider): Tab[] {
  switch (provider) {
    case "moviebox":
      return [
        { key: "trending", label: "Trending", fn: () => api.movieboxTrending(1) },
        { key: "homepage", label: "Beranda", fn: () => api.movieboxHomepage() },
      ];
    case "dramabox":
      return [
        { key: "trending", label: "Trending", fn: () => api.dramaboxTrending() },
        { key: "latest", label: "Terbaru", fn: () => api.dramaboxLatest() },
        { key: "foryou", label: "Untukmu", fn: () => api.dramaboxForyou(1) },
        { key: "vip", label: "VIP", fn: () => api.dramaboxVip() },
        { key: "random", label: "Acak", fn: () => api.dramaboxRandom() },
      ];
    case "reelshort":
      return [
        { key: "homepage", label: "Beranda", fn: () => api.reelshortHomepage() },
        { key: "foryou", label: "Untukmu", fn: () => api.reelshortForyou(1) },
      ];
    case "shortmax":
      return [
        { key: "latest", label: "Terbaru", fn: () => api.shortmaxLatest() },
        { key: "rekomendasi", label: "Rekomendasi", fn: () => api.shortmaxRekomendasi() },
        { key: "foryou", label: "Untukmu", fn: () => api.shortmaxForyou(1) },
        { key: "vip", label: "VIP", fn: () => api.shortmaxVip() },
      ];
    case "goodshort":
      return [
        { key: "trending", label: "Trending", fn: () => api.goodshortTrending() },
        { key: "latest", label: "Terbaru", fn: () => api.goodshortLatest() },
        { key: "foryou", label: "Untukmu", fn: () => api.goodshortForyou(1) },
        { key: "anime", label: "Anime", fn: () => api.goodshortAnime(1) },
      ];
    case "freereels":
      return [
        { key: "homepage", label: "Beranda", fn: () => api.freereelsHomepage() },
        { key: "anime", label: "Anime", fn: () => api.freereelsAnimepage() },
        { key: "foryou", label: "Untukmu", fn: () => api.freereelsForyou(0) },
      ];
    case "dramanova":
      return [
        { key: "home", label: "Beranda", fn: () => api.dramanovaHome(1) },
        { key: "drama18", label: "Drama 18+", fn: () => api.dramanovaDrama18(1) },
        { key: "komik", label: "Komik", fn: () => api.dramanovaKomik(1) },
      ];
    case "pinedrama":
      return [
        { key: "trending", label: "Trending", fn: () => api.pinedramaTrending() },
        { key: "foryou", label: "Untukmu", fn: () => api.pinedramaForyou() },
      ];
    case "anime":
      return [
        { key: "latest", label: "Terbaru", fn: () => api.animeLatest() },
        { key: "recommended", label: "Rekomendasi", fn: () => api.animeRecommended(1) },
        { key: "movie", label: "Movie", fn: () => api.animeMovie() },
      ];
  }
}

function BrowsePage() {
  const { provider } = useParams({ from: "/browse/$provider" }) as { provider: Provider };
  const meta = PROVIDERS.find((p) => p.id === provider);
  const tabs = useMemo(() => getTabs(provider), [provider]);
  const [active, setActive] = useState(tabs[0]?.key);
  const tab = tabs.find((t) => t.key === active) || tabs[0];

  const q = useQuery({
    queryKey: ["browse", provider, tab.key],
    queryFn: tab.fn,
    staleTime: 1000 * 60 * 5,
  });

  const items = (() => {
    const data: any = q.data;
    if (!data) return [];
    try {
      // moviebox homepage shape
      if (provider === "moviebox" && data.operatingList) {
        const lists: any[] = [];
        for (const op of data.operatingList) {
          if (op.subjects?.length) lists.push(...op.subjects);
        }
        return lists.map((r) => normalize("moviebox", r)).filter(Boolean);
      }
      
      // reelshort homepage shape - extract from nested lists
      if (provider === "reelshort" && data.lists && Array.isArray(data.lists)) {
        const books: any[] = [];
        for (const list of data.lists) {
          if (list.books && Array.isArray(list.books)) {
            books.push(...list.books);
          }
        }
        if (books.length > 0) {
          return books.map((r: any) => normalize(provider, r)).filter(Boolean);
        }
      }
      
      const list = pickList(data);
      if (!Array.isArray(list)) {
        console.warn("pickList returned non-array:", list);
        return [];
      }
      return list.map((r: any) => normalize(provider, r)).filter(Boolean);
    } catch (error) {
      console.error("Error processing items:", error, "data:", q.data);
      return [];
    }
  })();

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 pt-6 sm:px-6"
      >
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          {meta?.tag}
        </p>
        <h1 className="mt-1 text-3xl font-bold sm:text-4xl">
          <span className="text-gradient">{meta?.name}</span>
        </h1>
      </motion.div>

      <div className="scroll-row mt-4 px-4 sm:px-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            className={`rounded-full px-4 py-1.5 text-sm transition ${
              active === t.key
                ? "bg-white text-black"
                : "glass text-foreground hover:bg-white/15"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Section title="Hasil">
        {q.isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="skeleton aspect-[2/3] rounded-2xl" />
            ))}
          </div>
        ) : q.isError ? (
          <p className="text-sm text-destructive">
            Gagal memuat: {(q.error as Error).message}
          </p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Tidak ada hasil.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {items.map((it, i) => (
              <MovieCard
                key={it!.id + i}
                to={{ provider, id: it!.id }}
                title={it!.title}
                cover={it!.cover}
                rating={it!.rating}
                meta={it!.meta}
                badge={it!.badge}
                index={i}
                size="sm"
              />
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
