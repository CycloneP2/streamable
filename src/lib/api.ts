// Sansekai API client — all endpoints with advanced caching
const BASE = "https://api.sansekai.my.id/api";

// Memory cache untuk response cepat
const memoryCache = new Map<string, { data: any; timestamp: number }>();
const MEMORY_CACHE_TTL = 5 * 60 * 1000; // 5 menit
const DISK_CACHE_TTL = 60 * 60 * 1000; // 1 jam

// IndexedDB untuk persistent cache
let db: IDBDatabase | null = null;

async function initDB() {
  if (db) return db;
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("SansekaiCache", 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("cache")) {
        db.createObjectStore("cache", { keyPath: "key" });
      }
    };
  });
}

async function getCacheFromDB(key: string) {
  try {
    const database = await initDB();
    return new Promise((resolve) => {
      const transaction = database.transaction(["cache"], "readonly");
      const store = transaction.objectStore("cache");
      const request = store.get(key);
      request.onsuccess = () => {
        const result = request.result;
        if (result && Date.now() - result.timestamp < DISK_CACHE_TTL) {
          resolve(result.data);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function setCacheInDB(key: string, data: any) {
  try {
    const database = await initDB();
    const transaction = database.transaction(["cache"], "readwrite");
    const store = transaction.objectStore("cache");
    store.put({ key, data, timestamp: Date.now() });
  } catch {
    // Silently fail
  }
}

async function get<T = any>(path: string, params?: Record<string, any>): Promise<T> {
  const url = new URL(BASE + path);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
    }
  }

  const cacheKey = url.toString();

  // Check memory cache first (fastest)
  const memCached = memoryCache.get(cacheKey);
  if (memCached && Date.now() - memCached.timestamp < MEMORY_CACHE_TTL) {
    return memCached.data as T;
  }

  // Check disk cache (fast)
  const diskCached = await getCacheFromDB(cacheKey);
  if (diskCached) {
    // Restore to memory cache
    memoryCache.set(cacheKey, { data: diskCached, timestamp: Date.now() });
    return diskCached as T;
  }

  // Fetch from API with retry logic
  const userAgents = [
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  ];

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const headers = new Headers({
        "User-Agent": userAgents[attempt % userAgents.length],
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "id-ID,id;q=0.9,en;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "DNT": "1",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "cross-site",
        "Cache-Control": "no-cache",
      });

      const res = await fetch(url.toString(), {
        headers,
        method: "GET",
        mode: "cors",
        credentials: "omit",
      });

      if (res.status === 403) {
        lastError = new Error(`API 403 Forbidden`);
        if (attempt < 2) {
          await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
          continue;
        }
        throw lastError;
      }

      if (!res.ok) {
        throw new Error(`API ${res.status} ${res.statusText}`);
      }

      const json = await res.json();
      if (json?.error) throw new Error(json.message || json.error);

      // Cache the result
      memoryCache.set(cacheKey, { data: json, timestamp: Date.now() });
      await setCacheInDB(cacheKey, json);

      return json as T;
    } catch (error) {
      lastError = error as Error;
      if (attempt < 2) {
        console.warn(`⚠️ Attempt ${attempt + 1} failed for ${path}, retrying...`);
        await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
      }
    }
  }

  console.error(`❌ All attempts failed for ${path}:`, lastError);
  throw lastError || new Error("Failed to fetch from API");
}

export const api = {
  // PineDrama
  pinedramaForyou: (cursor?: string) => get("/pinedrama/foryou", { cursor }),
  pinedramaTrending: (cursor?: string) => get("/pinedrama/trending", { cursor }),
  pinedramaSearch: (query: string) => get("/pinedrama/search", { query }),
  pinedramaDetail: (collection_id: string) => get("/pinedrama/detail", { collection_id }),
  pinedramaEpisode: (collection_id: string, episodeNumber: number) =>
    get("/pinedrama/episode", { collection_id, episodeNumber }),

  // DramaBox
  dramaboxForyou: (page = 1) => get("/dramabox/foryou", { page }),
  dramaboxVip: () => get("/dramabox/vip"),
  dramaboxDubindo: (classify: string, page = 1) =>
    get("/dramabox/dubindo", { classify, page }),
  dramaboxRandom: () => get("/dramabox/randomdrama"),
  dramaboxLatest: () => get("/dramabox/latest"),
  dramaboxTrending: () => get("/dramabox/trending"),
  dramaboxPopulerSearch: () => get("/dramabox/populersearch"),
  dramaboxSearch: (query: string) => get("/dramabox/search", { query }),
  dramaboxDetail: (bookId: string) => get("/dramabox/detail", { bookId }),
  dramaboxAllEpisode: (bookId: string) => get("/dramabox/allepisode", { bookId }),
  dramaboxDecrypt: (url: string) => get("/dramabox/decrypt", { url }),

  // ReelShort
  reelshortForyou: (page = 1) => get("/reelshort/foryou", { page }),
  reelshortHomepage: () => get("/reelshort/homepage"),
  reelshortSearch: (query: string, page = 1) => get("/reelshort/search", { query, page }),
  reelshortDetail: (bookId: string) => get("/reelshort/detail", { bookId }),
  reelshortEpisode: (bookId: string, episodeNumber: number) =>
    get("/reelshort/episode", { bookId, episodeNumber }),

  // ShortMax
  shortmaxForyou: (page = 1) => get("/shortmax/foryou", { page }),
  shortmaxLatest: () => get("/shortmax/latest"),
  shortmaxRekomendasi: () => get("/shortmax/rekomendasi"),
  shortmaxVip: () => get("/shortmax/vip"),
  shortmaxSearch: (query: string) => get("/shortmax/search", { query }),
  shortmaxDetail: (shortPlayId: string) => get("/shortmax/detail", { shortPlayId }),
  shortmaxEpisode: (shortPlayId: string, episodeNumber: number) =>
    get("/shortmax/episode", { shortPlayId, episodeNumber }),

  // GoodShort
  goodshortForyou: (page = 1) => get("/goodshort/foryou", { page }),
  goodshortLatest: () => get("/goodshort/latest"),
  goodshortTrending: () => get("/goodshort/trending"),
  goodshortAnime: (page = 1) => get("/goodshort/anime", { page }),
  goodshortSearch: (query: string) => get("/goodshort/search", { query }),
  goodshortDetail: (bookId: string) => get("/goodshort/detail", { bookId }),
  goodshortAllEpisode: (bookId: string) => get("/goodshort/allepisode", { bookId }),
  goodshortDecrypt: (url: string) => get("/goodshort/decrypt", { url }),

  // FreeReels
  freereelsForyou: (offset = 0) => get("/freereels/foryou", { offset }),
  freereelsHomepage: () => get("/freereels/homepage"),
  freereelsAnimepage: () => get("/freereels/animepage"),
  freereelsSearch: (query: string) => get("/freereels/search", { query }),
  freereelsDetail: (key: string) => get("/freereels/detailAndAllEpisode", { key }),

  // DramaNova
  dramanovaHome: (page = 1) => get("/dramanova/home", { page }),
  dramanovaDrama18: (page = 1) => get("/dramanova/drama18", { page }),
  dramanovaKomik: (page = 1) => get("/dramanova/komik", { page }),
  dramanovaSearch: (query: string) => get("/dramanova/search", { query }),
  dramanovaDetail: (dramaId: string) => get("/dramanova/detail", { dramaId }),
  dramanovaGetVideo: (fileId: string) => get("/dramanova/getvideo", { fileId }),

  // Anime
  animeLatest: () => get("/anime/latest"),
  animeRecommended: (page = 1) => get("/anime/recommended", { page }),
  animeMovie: () => get("/anime/movie"),
  animeSearch: (query: string) => get("/anime/search", { query }),
  animeDetail: (urlId: string) => get("/anime/detail", { urlId }),
  animeGetVideo: (chapterUrlId: string, reso?: string) =>
    get("/anime/getvideo", { chapterUrlId, reso }),

  // Komik
  komikRecommended: (type: string) => get("/komik/recommended", { type }),
  komikLatest: (type: string) => get("/komik/latest", { type }),
  komikSearch: (query: string) => get("/komik/search", { query }),
  komikPopular: (page = 1) => get("/komik/popular", { page }),
  komikDetail: (manga_id: string) => get("/komik/detail", { manga_id }),
  komikChapterList: (manga_id: string) => get("/komik/chapterlist", { manga_id }),
  komikGetImage: (chapter_id: string) => get("/komik/getimage", { chapter_id }),

  // MovieBox
  movieboxHomepage: () => get("/moviebox/homepage"),
  movieboxTrending: (page = 1) => get("/moviebox/trending", { page }),
  movieboxSearch: (query: string, page = 1) => get("/moviebox/search", { query, page }),
  movieboxDetail: (subjectId: string) => get("/moviebox/detail", { subjectId }),
  movieboxSources: (subjectId: string, season?: number, episode?: number) =>
    get("/moviebox/sources", { subjectId, season, episode }),
  movieboxGenerateLink: (url: string) =>
    get("/moviebox/generate-link-stream-video", { url }),

  // AI
  aiChatGPT: (prompt: string) => get("/ai/chatgpt", { prompt }),
};

export type Provider =
  | "moviebox"
  | "dramabox"
  | "reelshort"
  | "shortmax"
  | "goodshort"
  | "freereels"
  | "dramanova"
  | "pinedrama"
  | "anime";

export const PROVIDERS: { id: Provider; name: string; tag: string }[] = [
  { id: "moviebox", name: "MovieBox", tag: "Film & Serial" },
  { id: "dramabox", name: "DramaBox", tag: "Drama Pendek" },
  { id: "reelshort", name: "ReelShort", tag: "Drama Vertikal" },
  { id: "shortmax", name: "ShortMax", tag: "Short Drama" },
  { id: "goodshort", name: "GoodShort", tag: "Drama HD" },
  { id: "freereels", name: "FreeReels", tag: "Reels Gratis" },
  { id: "dramanova", name: "DramaNova", tag: "Nova Drama" },
  { id: "pinedrama", name: "PineDrama", tag: "Pine Drama" },
  { id: "anime", name: "Anime", tag: "Anime Sub Indo" },
];
