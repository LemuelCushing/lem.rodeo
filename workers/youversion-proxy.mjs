const YouVersionApi = "https://api.youversion.com/v1"
const PassageId = /^[1-3]?[A-Z]{2,3}\.\d{1,3}\.\d{1,3}$/

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
      "Access-Control-Allow-Methods": "GET, OPTIONS",
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
