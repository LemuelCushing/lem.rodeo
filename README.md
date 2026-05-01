# lem.rodeo

Small static page: a random NET Bible verse over a random Wikimedia Commons
background, with a deliberately hidden, slightly broken control popup.

## Repository Layout

```text
public/             static site served at lem.rodeo
  index.html        the page
  site.webmanifest  PWA manifest + favicons
workers/            Cloudflare Worker source
  youversion-proxy.mjs   /api/youversion/* edge proxy
wrangler.toml       Worker + assets config
package.json        npm scripts (site:deploy, worker:dev, worker:deploy, ...)
```

Anything outside `public/` and `workers/` (screenshots, scratch HTML, README,
config) is workspace material — never shipped.

## Static Site

The public site is served from Surge:

```sh
npm run site:deploy
```

This deploys the contents of `public/` to `lem.rodeo` via Surge. Cloudflare
sits in front of Surge and routes `/api/*` to the Worker while leaving the
static page on Surge.

The live response currently confirms Surge behind Cloudflare:

```text
server: cloudflare
surge-cache: HIT
```

## DNS

`lem.rodeo` uses Cloudflare nameservers:

```text
anahi.ns.cloudflare.com
sean.ns.cloudflare.com
```

The apex and `www` resolve to Cloudflare proxy addresses, so live DNS lookups do
not expose the Surge origin.

## YouVersion Edge Proxy

The static page must not contain the YouVersion app key. The Worker in
`workers/youversion-proxy.mjs` injects the key server-side and exposes only
narrow, allowlisted routes:

```text
GET /api/youversion/verse?bible=3034&passage=JHN.3.16
GET /api/youversion/bibles?language=en
```

`/api/youversion/verse` returns normalized JSON with the verse text, reference,
translation metadata, and copyright attribution.

`/api/youversion/bibles` lists licensed Bible versions for an allowlisted
language. The active language allowlist is:

```text
en, he, de, fr
```

The current Bible allowlist covers the licensed English, Hebrew, German, and
French versions returned by YouVersion after license acceptance.

Bulgarian (`bg`) is not in the active flow right now. As of May 1, 2026 the
YouVersion API recognizes Bulgarian as a language, but returns no Bible content
for it under this app key.

## Local Development

`wrangler dev` serves both the static site (from `public/`) and the Worker
(`/api/*`) on a single origin, matching the production split:

```sh
npm run worker:dev
```

The dev server binds to `http://localhost:8788`. Port 8787 is intentionally
avoided so Headroom can keep that one. Open the page at the dev URL to exercise
real `T`/`L` translation cycling against the live YouVersion API.

`Ctrl+C` on `wrangler dev` is known to hang on shutdown — pressing it twice
forces the kill. The `[x]` menu option in wrangler's UI hangs in the same way.

## Cloudflare Setup

No local Wrangler install is required. Use `npx` for one-off commands. Run an
explicit subcommand such as `login`, `deploy`, or `tail`; bare `npx wrangler`
only proves npm can resolve the package and is not a useful setup check.

Wrangler currently pulls in `sharp`, which can notice Homebrew's global `libvips`
and try to compile from source. Keep `SHARP_IGNORE_GLOBAL_LIBVIPS=1` on raw
Wrangler commands so npm uses the packaged binary instead.

Smoke-test Wrangler:

```sh
npm run worker:version
```

Authenticate Wrangler:

```sh
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npx --yes wrangler@latest login
```

Set the YouVersion app key as a Cloudflare secret. Do not put the key in
`public/index.html`, `wrangler.toml`, README, chat, or git.

```sh
op read "op://Private/youversion.com bible API - lem.rodeo key/credential" | SHARP_IGNORE_GLOBAL_LIBVIPS=1 npx --yes wrangler@latest secret put YVP_APP_KEY
```

For local development, put the key in `.dev.vars` at the repo root:

```text
YVP_APP_KEY="..."
```

`.dev.vars*` and `.env*` are ignored by git.

Deploy the Worker route:

```sh
npm run worker:deploy
```

`wrangler.toml` routes the Worker to:

```text
lem.rodeo/api/*
```

## Baseline Bible Source

The default verse still comes from the existing NET Bible Labs endpoint:

```text
https://labs.bible.org/api/?passage=random&type=json
```

The YouVersion proxy is for alternate versions/languages of the same verse, not
for choosing the random verse.
