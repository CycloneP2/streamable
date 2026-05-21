// Normalize various provider response shapes into a uniform card item.
import type { Provider } from "./api";

export interface CardItem {
  id: string;
  title: string;
  cover?: string;
  rating?: string | number;
  meta?: string;
  badge?: string;
}

function pick(...vals: any[]) {
  for (const v of vals) if (v !== undefined && v !== null && v !== "") return v;
  return undefined;
}

export function normalize(provider: Provider, raw: any): CardItem | null {
  if (!raw) return null;
  switch (provider) {
    case "moviebox": {
      const cover = raw.cover?.url || raw.image?.url;
      return {
        id: String(raw.subjectId || raw.id || ""),
        title: raw.title || raw.name || "",
        cover,
        rating: raw.imdbRatingValue,
        meta: [raw.countryName, raw.genre?.split(",")[0]].filter(Boolean).join(" • "),
        badge: raw.subjectType === 2 ? "Series" : raw.subjectType === 1 ? "Movie" : undefined,
      };
    }
    case "dramabox":
    case "goodshort": {
      return {
        id: String(raw.bookId || ""),
        title: raw.bookName || raw.title || "",
        cover: raw.coverWap || raw.cover,
        meta: raw.chapterCount ? `${raw.chapterCount} eps` : undefined,
      };
    }
    case "reelshort": {
      return {
        id: String(raw.bookId || raw.id || ""),
        title: raw.bookName || raw.name || raw.title || "",
        cover: raw.cover || raw.coverWap || raw.coverImage,
        meta: raw.chapterCount ? `${raw.chapterCount} eps` : undefined,
      };
    }
    case "shortmax": {
      return {
        id: String(raw.shortPlayId || ""),
        title: raw.name || "",
        cover: raw.cover,
        meta: raw.totalEpisodes ? `${raw.totalEpisodes} eps` : undefined,
        badge: raw.label,
      };
    }
    case "freereels": {
      return {
        id: String(raw.key || raw.id || ""),
        title: raw.title || raw.name || "",
        cover: raw.cover || raw.image,
      };
    }
    case "dramanova": {
      return {
        id: String(raw.dramaId || raw.id || ""),
        title: raw.title || raw.name || "",
        cover: raw.cover || raw.image,
      };
    }
    case "pinedrama": {
      return {
        id: String(raw.collection_id || raw.id || ""),
        title: raw.title || raw.name || "",
        cover: raw.cover || raw.image || raw.thumbnail,
      };
    }
    case "anime": {
      return {
        id: String(raw.url || raw.urlId || raw.id || ""),
        title: raw.judul || raw.title || "",
        cover: raw.cover,
        meta: pick(raw.lastch, raw.lastup),
      };
    }
  }
}

// Extract array from any response shape
export function pickList(raw: any): any[] {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== 'object') return [];
  
  // Try common array properties
  const arrayProps = [
    'subjectList',
    'items',
    'results',
    'data',
    'list',
    'records',
    'subjects',
    'books',
    'dramas',
    'animes',
    'komiks',
  ];
  
  for (const prop of arrayProps) {
    const value = raw[prop];
    if (Array.isArray(value)) return value;
  }
  
  // If data is an object with array values, try to extract them
  const values = Object.values(raw);
  const arrayValue = values.find(v => Array.isArray(v));
  if (arrayValue) return arrayValue as any[];
  
  return [];
}
