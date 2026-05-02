const YouVersionApi = "https://api.youversion.com/v1"
const SefariaApi = "https://www.sefaria.org/api"
const PassageId = /^[1-3]?[A-Z]{2,3}\.\d{1,3}\.\d{1,3}$/

const SefariaBookByBibleBookId = {
  GEN: "Genesis", EXO: "Exodus", LEV: "Leviticus", NUM: "Numbers", DEU: "Deuteronomy",
  JOS: "Joshua", JDG: "Judges", RUT: "Ruth",
  "1SA": "I_Samuel", "2SA": "II_Samuel",
  "1KI": "I_Kings", "2KI": "II_Kings",
  "1CH": "I_Chronicles", "2CH": "II_Chronicles",
  EZR: "Ezra", NEH: "Nehemiah", EST: "Esther",
  JOB: "Job", PSA: "Psalms", PRO: "Proverbs", ECC: "Ecclesiastes", SNG: "Song_of_Songs",
  ISA: "Isaiah", JER: "Jeremiah", LAM: "Lamentations", EZK: "Ezekiel", DAN: "Daniel",
  HOS: "Hosea", JOL: "Joel", AMO: "Amos", OBA: "Obadiah", JON: "Jonah",
  MIC: "Micah", NAM: "Nahum", HAB: "Habakkuk", ZEP: "Zephaniah",
  HAG: "Haggai", ZEC: "Zechariah", MAL: "Malachi"
}

const SefariaTanakh = {
  id: "sef-tanakh",
  abbreviation: "WLC",
  title: "Westminster Leningrad Codex",
  languageTag: "he",
  publisherUrl: "https://www.sefaria.org/"
}

// Bulgarian OSIS, pre-parsed from gratis-bible/bible@<pinned> by
// scripts/build_bulgarian.rb into public/data/bg/<bibleId>/<OsisBook>.json.
const GratisBibleManifest = {
  "gb-bulcarigradnt": {
    abbreviation: "TSAR",
    title: "Tsarigrad New Testament",
    languageTag: "bg",
    publisherUrl: "https://github.com/gratis-bible/bible",
    copyright: "Public domain. OSIS edition: gratis-bible/bible (CDL Project)."
  },
  "gb-bulveren": {
    abbreviation: "VRN",
    title: "Veren's Contemporary Bible",
    languageTag: "bg",
    publisherUrl: "https://github.com/gratis-bible/bible",
    copyright: "Veren LTD. OSIS edition: gratis-bible/bible (CDL Project)."
  }
}

// YouVersion-style book IDs → OSIS osisID prefixes used by gratis-bible.
const OsisBookByBibleBookId = {
  GEN: "Gen", EXO: "Exod", LEV: "Lev", NUM: "Num", DEU: "Deut",
  JOS: "Josh", JDG: "Judg", RUT: "Ruth",
  "1SA": "1Sam", "2SA": "2Sam", "1KI": "1Kgs", "2KI": "2Kgs",
  "1CH": "1Chr", "2CH": "2Chr", EZR: "Ezra", NEH: "Neh", EST: "Esth",
  JOB: "Job", PSA: "Ps", PRO: "Prov", ECC: "Eccl", SNG: "Song",
  ISA: "Isa", JER: "Jer", LAM: "Lam", EZK: "Ezek", DAN: "Dan",
  HOS: "Hos", JOL: "Joel", AMO: "Amos", OBA: "Obad", JON: "Jonah",
  MIC: "Mic", NAM: "Nah", HAB: "Hab", ZEP: "Zeph", HAG: "Hag",
  ZEC: "Zech", MAL: "Mal",
  MAT: "Matt", MRK: "Mark", LUK: "Luke", JHN: "John", ACT: "Acts",
  ROM: "Rom", "1CO": "1Cor", "2CO": "2Cor", GAL: "Gal", EPH: "Eph",
  PHP: "Phil", COL: "Col", "1TH": "1Thess", "2TH": "2Thess",
  "1TI": "1Tim", "2TI": "2Tim", TIT: "Titus", PHM: "Phlm",
  HEB: "Heb", JAS: "Jas", "1PE": "1Pet", "2PE": "2Pet",
  "1JN": "1John", "2JN": "2John", "3JN": "3John", JUD: "Jude", REV: "Rev"
}

// Native Bulgarian book labels for the citation line.
const BulgarianBookNames = {
  GEN: "Битие", EXO: "Изход", LEV: "Левит", NUM: "Числа", DEU: "Второзаконие",
  JOS: "Иисус Навиев", JDG: "Съдии", RUT: "Рут",
  "1SA": "1 Царе", "2SA": "2 Царе", "1KI": "3 Царе", "2KI": "4 Царе",
  "1CH": "1 Летописи", "2CH": "2 Летописи", EZR: "Ездра", NEH: "Неемия", EST: "Естир",
  JOB: "Йов", PSA: "Псалми", PRO: "Притчи", ECC: "Еклесиаст", SNG: "Песен на песните",
  ISA: "Исая", JER: "Еремия", LAM: "Плачът на Еремия", EZK: "Езекиил", DAN: "Даниил",
  HOS: "Осия", JOL: "Йоил", AMO: "Амос", OBA: "Авдий", JON: "Йона",
  MIC: "Михей", NAM: "Наум", HAB: "Авакум", ZEP: "Софония", HAG: "Агей",
  ZEC: "Захария", MAL: "Малахия",
  MAT: "Матей", MRK: "Марк", LUK: "Лука", JHN: "Йоан", ACT: "Деяния",
  ROM: "Римляни", "1CO": "1 Коринтяни", "2CO": "2 Коринтяни", GAL: "Галатяни",
  EPH: "Ефесяни", PHP: "Филипяни", COL: "Колосяни",
  "1TH": "1 Солунци", "2TH": "2 Солунци", "1TI": "1 Тимотей", "2TI": "2 Тимотей",
  TIT: "Тит", PHM: "Филимон", HEB: "Евреи", JAS: "Яков",
  "1PE": "1 Петрово", "2PE": "2 Петрово",
  "1JN": "1 Йоаново", "2JN": "2 Йоаново", "3JN": "3 Йоаново",
  JUD: "Юда", REV: "Откровение"
}

class YouVersionError extends Error {
  constructor(status, body) {
    super(`YouVersion ${status}: ${body.slice(0, 240)}`)
    this.upstreamStatus = status
    this.clientStatus = status >= 400 && status < 500 ? status : 502
  }
}

export default {
  async fetch(request, env, context) {
    const url = new URL(request.url)

    if (request.method === "OPTIONS") return optionsResponse(request, env)

    if (url.pathname === "/api/log/popup") {
      if (request.method !== "POST") return errorResponse(request, env, 405, "POST only")
      return logEvent("popup", request, env, context)
    }

    if (url.pathname === "/api/log/download") {
      if (request.method !== "POST") return errorResponse(request, env, 405, "POST only")
      return logEvent("download", request, env, context)
    }

    if (request.method !== "GET") return errorResponse(request, env, 405, "GET only")

    if (!env.YVP_APP_KEY) {
      return errorResponse(request, env, 500, "YVP_APP_KEY is not configured")
    }

    try {
      if (url.pathname === "/api/youversion/verse") {
        return await verseResponse(request, env, context, url)
      }

      if (url.pathname === "/api/youversion/bibles") {
        return await biblesResponse(request, env, context, url)
      }
    } catch (error) {
      return errorResponse(request, env, error.clientStatus || 502, error.message)
    }

    return errorResponse(request, env, 404, "Unknown API route")
  }
}

async function verseResponse(request, env, context, url) {
  const bibleId = url.searchParams.get("bible") || url.searchParams.get("bible_id")
  const passageId = (url.searchParams.get("passage") || "").toUpperCase()

  if (!allowedValues(env.YVP_ALLOWED_BIBLE_IDS).has(bibleId)) {
    return errorResponse(request, env, 400, "Bible is not allowlisted")
  }

  if (!PassageId.test(passageId)) {
    return errorResponse(request, env, 400, "Passage must look like JHN.3.16")
  }

  if (bibleId.startsWith("sef-")) {
    return cachedJson(request, env, context, `verse:${bibleId}:${passageId}`, () =>
      sefariaPassage(bibleId, passageId)
    )
  }

  if (bibleId.startsWith("gb-")) {
    return cachedJson(request, env, context, `verse:${bibleId}:${passageId}`, () =>
      gratisBiblePassage(env, request, bibleId, passageId)
    )
  }

  return cachedJson(request, env, context, `verse:${bibleId}:${passageId}`, async () => {
    const [passage, bible] = await Promise.all([
      passageJson(env, bibleId, passageId),
      youVersionJson(env, `/bibles/${bibleId}`)
    ])

    return {
      source: "youversion",
      passageId: passage.id || passageId,
      reference: passage.reference,
      text: compactText(passage.content),
      translation: {
        id: bible.id || Number(bibleId),
        abbreviation: bible.localized_abbreviation || bible.abbreviation,
        title: bible.localized_title || bible.title,
        languageTag: bible.language_tag,
        publisherUrl: bible.publisher_url || bible.youversion_deep_link
      },
      copyright: bible.copyright || bible.copyright_short || "",
      publisherUrl: bible.publisher_url || bible.youversion_deep_link || ""
    }
  })
}

async function sefariaPassage(bibleId, passageId) {
  const [bookId, chapter, verse] = passageId.split(".")
  const sefariaBook = SefariaBookByBibleBookId[bookId]
  if (!sefariaBook) throw new YouVersionError(404, `${bookId} is not in the Tanakh`)

  const ref = `${sefariaBook}.${chapter}.${verse}`
  const response = await fetch(`${SefariaApi}/texts/${ref}?context=0`)
  if (!response.ok) throw new YouVersionError(response.status, await response.text())

  const data = await response.json()
  const raw = Array.isArray(data.he) ? data.he.join(" ") : data.he || ""
  const text = stripSefariaMarkup(raw)
  if (!text) throw new YouVersionError(404, `no Hebrew text for ${ref}`)

  return {
    source: "sefaria",
    passageId,
    reference: data.ref || `${sefariaBook.replace(/_/g, " ")} ${chapter}:${verse}`,
    text,
    translation: SefariaTanakh,
    copyright: "Westminster Leningrad Codex (CC0). Served via Sefaria.",
    publisherUrl: SefariaTanakh.publisherUrl
  }
}

function stripSefariaMarkup(input) {
  return String(input)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
}

async function gratisBiblePassage(env, request, bibleId, passageId) {
  const manifest = GratisBibleManifest[bibleId]
  if (!manifest) throw new YouVersionError(404, `${bibleId} is not a gratis-bible source`)

  const [bookId, chapter, verse] = passageId.split(".")
  const osisBook = OsisBookByBibleBookId[bookId]
  if (!osisBook) throw new YouVersionError(404, `${bookId} is not a known book`)

  const assetUrl = new URL(`/data/bg/${bibleId}/${osisBook}.json`, request.url)
  const response = await env.ASSETS.fetch(assetUrl)
  if (!response.ok) throw new YouVersionError(404, `${bibleId} does not include ${osisBook}`)

  const verses = await response.json()
  const text = verses[`${chapter}.${verse}`]
  if (!text) throw new YouVersionError(404, `no verse ${passageId} in ${bibleId}`)

  return {
    source: "gratis-bible",
    passageId,
    reference: `${BulgarianBookNames[bookId] || osisBook} ${chapter}:${verse}`,
    text,
    translation: { id: bibleId, ...manifest },
    copyright: manifest.copyright,
    publisherUrl: manifest.publisherUrl
  }
}

async function passageJson(env, bibleId, passageId) {
  try {
    return await youVersionPassageJson(env, bibleId, passageId)
  } catch (error) {
    if (!(error instanceof YouVersionError) || error.upstreamStatus !== 404) throw error

    const translatedPassageId = await versionPassageId(env, bibleId, passageId)
    if (!translatedPassageId || translatedPassageId === passageId) throw error

    return youVersionPassageJson(env, bibleId, translatedPassageId)
  }
}

function youVersionPassageJson(env, bibleId, passageId) {
  return youVersionJson(env, `/bibles/${bibleId}/passages/${passageId}`, {
    format: "text",
    include_headings: "false",
    include_notes: "false"
  })
}

async function versionPassageId(env, bibleId, passageId) {
  const [bookId, chapterNumber, verseNumber] = passageId.split(".")
  const payload = await youVersionJson(env, `/bibles/${bibleId}/books/${bookId}/chapters`)
  const chapter = (payload.data || []).find(item => chapterOrdinal(item) === chapterNumber)
  const verse = chapter?.verses?.find(item => verseOrdinal(item) === verseNumber)

  return verse?.passage_id
}

function chapterOrdinal(chapter) {
  return ordinalFrom(chapter.passage_id, /^[A-Z0-9]{2,4}\.(\d+)/) || ordinalFrom(chapter.id, /^(\d+)/)
}

function verseOrdinal(verse) {
  return ordinalFrom(verse.passage_id, /\.(\d+)$/) || ordinalFrom(verse.id, /^(\d+)$/) || verse.title
}

function ordinalFrom(value, pattern) {
  return String(value || "").match(pattern)?.[1]
}

async function biblesResponse(request, env, context, url) {
  const language = (url.searchParams.get("language") || "en").toLowerCase()

  if (!allowedValues(env.YVP_ALLOWED_LANGUAGES).has(language)) {
    return errorResponse(request, env, 400, "Language is not allowlisted")
  }

  const payload = await youVersionJson(env, "/bibles", {
    "language_ranges[]": language,
    page_size: "100"
  })

  return withCors(jsonResponse({
    source: "youversion",
    language,
    totalSize: payload.total_size || 0,
    bibles: (payload.data || []).map(bible => ({
      id: bible.id,
      abbreviation: bible.localized_abbreviation || bible.abbreviation,
      title: bible.localized_title || bible.title,
      languageTag: bible.language_tag || bible.language?.iso_639_1,
      copyright: bible.copyright || bible.copyright_short || "",
      publisherUrl: bible.publisher_url || bible.youversion_deep_link || ""
    }))
  }, {
    "Cache-Control": "no-store"
  }), request, env)
}

async function youVersionJson(env, path, params = {}) {
  const url = new URL(`${YouVersionApi}${path}`)
  Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value))

  const response = await fetch(url, {
    headers: {
      "Accept": "application/json",
      "X-YVP-App-Key": env.YVP_APP_KEY
    }
  })

  const body = await response.text()

  if (!response.ok) {
    throw new YouVersionError(response.status, body)
  }

  return body ? JSON.parse(body) : {}
}

async function cachedJson(request, env, context, key, loader) {
  const cache = caches.default
  const cacheRequest = new Request(`https://lem.rodeo/__worker-cache/${encodeURIComponent(key)}`)
  const cached = await cache.match(cacheRequest)

  if (cached) return withCors(cached, request, env)

  const response = jsonResponse(await loader(), {
    "Cache-Control": "public, max-age=300, s-maxage=86400"
  })

  context.waitUntil(cache.put(cacheRequest, response.clone()))

  return withCors(response, request, env)
}

function jsonResponse(payload, headers = {}, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...headers
    }
  })
}

function errorResponse(request, env, status, message) {
  return withCors(jsonResponse({ error: message }, { "Cache-Control": "no-store" }, status), request, env)
}

function optionsResponse(request, env) {
  return withCors(new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400"
    }
  }), request, env)
}

function withCors(response, request, env) {
  const origin = request.headers.get("Origin")
  const headers = new Headers(response.headers)
  const allowedOrigin = allowedValues(env.YVP_ALLOWED_ORIGINS).has(origin)

  if (allowedOrigin) {
    headers.set("Access-Control-Allow-Origin", origin)
    headers.append("Vary", "Origin")
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  })
}

function allowedValues(value) {
  return new Set((value || "").split(",").map(item => item.trim()).filter(Boolean))
}

function compactText(text) {
  return (text || "").replace(/\s+/g, " ").trim()
}

const EventVariants = {
  popup:    { consoleLabel: "popup-open", ntfyTag: "popcorn",    fallbackTitle: "lem.rodeo" },
  download: { consoleLabel: "download",   ntfyTag: "arrow_down", fallbackTitle: "lem.rodeo download" }
}

async function logEvent(kind, request, env, context) {
  const variant = EventVariants[kind]
  if (!variant) return errorResponse(request, env, 400, "unknown event kind")

  let payload = {}
  try {
    const text = await request.text()
    if (text && text.length <= 2048) payload = JSON.parse(text)
  } catch {}

  const cf = request.cf || {}
  const userAgent = request.headers.get("User-Agent") || ""

  const fields = {
    kind,
    citation: String(payload.citation || ""),
    translation: String(payload.translation || ""),
    language: String(payload.language || ""),
    passageId: String(payload.passageId || ""),
    imageTitle: String(payload.imageTitle || ""),
    pageUrl: String(payload.pageUrl || ""),
    imageUrl: String(payload.imageUrl || ""),
    locale: String(payload.locale || ""),
    country: String(cf.country || ""),
    city: String(cf.city || ""),
    region: String(cf.region || ""),
    timezone: String(cf.timezone || ""),
    colo: String(cf.colo || ""),
    userAgent,
    viewportW: Number(payload.viewportW) || 0,
    viewportH: Number(payload.viewportH) || 0,
    dpr: Number(payload.dpr) || 0
  }

  if (kind === "popup" && env.POPUP_LOG?.writeDataPoint) {
    try {
      env.POPUP_LOG.writeDataPoint({
        indexes: [fields.citation.slice(0, 96)],
        blobs: [
          fields.translation, fields.language, fields.imageTitle, fields.pageUrl,
          fields.country, fields.city, fields.region, fields.timezone,
          fields.colo, fields.locale, fields.userAgent, fields.passageId,
          fields.imageUrl
        ],
        doubles: [fields.viewportW, fields.viewportH, fields.dpr]
      })
    } catch (error) {
      console.warn("POPUP_LOG write failed:", error.message)
    }
  }

  console.log(variant.consoleLabel, JSON.stringify(fields))

  // Both topic and token are required: the production topic is reserved on the
  // Supporter tier ("Only I can publish and subscribe"), so anonymous publishes
  // always 403. Skipping when either is unset keeps local-dev logs quiet.
  // `LEM_NTFY_DISABLED` is a dev override — `npm run dev` sets it so a populated
  // .dev.vars doesn't fire pushes; `npm run dev:ntfy` leaves it unset.
  if (env.NTFY_TOPIC && env.NTFY_TOKEN && !env.LEM_NTFY_DISABLED) {
    const title = fields.citation || variant.fallbackTitle
    const where = [fields.city, fields.country].filter(Boolean).join(", ")
    const body = [
      `${fields.translation || "?"} · ${fields.language || "?"}`,
      fields.imageTitle && `bg: ${fields.imageTitle}`,
      where
    ].filter(Boolean).join("\n")

    // Posting to /<topic> with header metadata (rather than JSON-to-root). The
    // JSON-root form silently 200'd-but-dropped from CF colo IPs even with valid
    // Bearer auth. The /<topic> form is what `curl -d ... ntfy.sh/topic` does
    // and was confirmed to deliver. Non-ASCII (Hebrew, Bulgarian, …) in the title
    // travels via UTF-8 in the header value — ntfy accepts it.
    const headers = {
      "Title": title,
      "Tags": variant.ntfyTag,
      "Click": fields.pageUrl || "https://lem.rodeo",
      "User-Agent": "lem.rodeo-worker/1.0 (+https://lem.rodeo)",
      "Authorization": `Bearer ${env.NTFY_TOKEN}`
    }

    context.waitUntil(
      fetch(`https://ntfy.sh/${encodeURIComponent(env.NTFY_TOPIC)}`, {
        method: "POST",
        headers,
        body
      })
        .then(async response => {
          if (response.ok) return console.log(`ntfy push ok status=${response.status}`)
          const detail = (await response.text()).slice(0, 200)
          console.warn(`ntfy push FAILED status=${response.status} body=${detail}`)
        })
        .catch(error => console.warn("ntfy push errored:", error.message))
    )
  }

  return withCors(new Response(null, { status: 204 }), request, env)
}
