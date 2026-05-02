# AGENTS.md

Working notes for AI agents and humans driving the repo. Tight, opinionated,
load-bearing — read this before changing anything structural.

## What this is

A tiny single-page site (`public/index.html`) that loops a random Bible verse
over a random Wikimedia background. Translation/language cycling goes through a
Cloudflare Worker (`workers/youversion-proxy.mjs`) that hides the YouVersion
app key. There is no build step, no framework, no bundler.

## Layout that matters

- `public/` — the entire static site. **wrangler dev watches this directory**;
  anything written here triggers a reload, so don't dump screenshots, scratch
  files, or build output into it.
- `workers/youversion-proxy.mjs` — the only server code. Allowlists languages,
  Bible IDs, and origins. Fails closed.
- `wrangler.toml` — Worker + `[assets]` config. `run_worker_first = ["/api/*"]`
  means everything else is served straight from `public/`.
- `package.json` — scripts are the canonical entry points; prefer them over
  raw `wrangler` commands.
- Everything else at the repo root (`reference/`, screenshots, `poline.html`,
  `scratch.html`, etc.) is workspace material. Never shipped.

## Day-to-day

```sh
npm run worker:dev      # local dev on http://localhost:8788
npm run site:deploy     # publish public/ to Surge
npm run worker:deploy   # publish the Worker
```

Local dev needs a `.dev.vars` at the repo root:

```text
YVP_APP_KEY="..."
NTFY_TOPIC="lem-rodeo-popup-..."   # optional; enables popup-open push notifications
```

Pull these from 1Password rather than typing/pasting; never commit them
(gitignored already).

### Setting Worker secrets in prod

Use the explicit invocation — a bare `npx wrangler ...` may resolve a
different binary on first run:

```sh
RP_IGNORE_GLOBAL_LIBVIPS=1 npx --yes wrangler@latest secret put YVP_APP_KEY
RP_IGNORE_GLOBAL_LIBVIPS=1 npx --yes wrangler@latest secret put NTFY_TOPIC
RP_IGNORE_GLOBAL_LIBVIPS=1 npx --yes wrangler@latest secret list
```

A successful upload ends with `✨ Success! Uploaded secret X`. A line that
ends in `✖ Enter a secret value:` was cancelled — nothing was written and
nothing was overwritten.

## Known gotchas

- **Port 8788, not 8787.** 8787 is reserved for Headroom in this user's setup.
  The CORS allowlist in `wrangler.toml` matches 8788; changing it requires
  updating `YVP_ALLOWED_ORIGINS` in lockstep.
- **`Ctrl+C` hangs `wrangler dev` on shutdown.** Upstream bug. Press it twice;
  `[x]` in the wrangler menu hangs the same way.
- **Don't widen `[assets].directory`** back to `.` — wrangler's asset watcher
  doesn't honor `.assetsignore` for change detection, so any directory it
  watches that wrangler also writes to (`.wrangler/`, `.dev.vars`, screenshots
  saved during dev) loops the reloader forever.
- **Failure feedback is ambiguous.** The 160ms `quote-nudge` shake is fired
  both for trail-edge hits *and* translation lookup failures. If `T`/`L` jitter
  with no visible change, the YouVersion proxy is unreachable — check that
  wrangler dev is the thing on 8788, not a stray static server.
- **Initial verse → translation cycling.** `current.passageId` is derived from
  the random verse's `bookname` via `BibleBookIds`. If the bookname doesn't
  match the map, `passageId` is empty and `T`/`L` nudge with no network call.
  Don't assume the worker is broken before checking the network tab.

## Conventions

- Single-source `index.html`. No bundler, no transpiler, no framework. Modern
  browser features only — pattern match what's already in the file.
- Worker code is plain `.mjs`, fail-closed, allowlist-driven. Add new routes
  next to the existing pattern in `youversion-proxy.mjs`.
- Don't introduce a build step or frontend framework without an explicit
  conversation. The tiny-static-page property is a feature, not a constraint
  to relax.
- Commits: the user runs git themselves. Don't author or co-author commits.

## Secrets

- `YVP_APP_KEY` lives in Cloudflare Worker secrets in prod, `.dev.vars` in dev.
  Never in source, README, chat, or commits.
- The allowlists in `wrangler.toml` (`YVP_ALLOWED_BIBLE_IDS`,
  `YVP_ALLOWED_LANGUAGES`, `YVP_ALLOWED_ORIGINS`) are intentionally explicit.
  Widen with care.
