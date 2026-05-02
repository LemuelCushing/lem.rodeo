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
- `public/data/bg/<bibleId>/<OsisBook>.json` — pre-parsed Bulgarian verses
  (Tsarigrad NT, Veren). Generated; committed; the Worker reads them via the
  `ASSETS` binding. See "Bulgarian translations" below.
- `workers/youversion-proxy.mjs` — the only server code. Allowlists languages,
  Bible IDs, and origins. Fails closed.
- `wrangler.toml` — Worker + `[assets]` config. `run_worker_first = ["/api/*"]`
  means everything else is served straight from `public/`.
- `scripts/build_bulgarian.rb` — one-shot Ruby/Nokogiri parser for the
  Bulgarian OSIS sources. Run manually only.
- `Gemfile` — declares the single Ruby dep (Nokogiri). Yields a `Gemfile.lock`
  after `bundle install`.
- `package.json` — scripts are the canonical entry points; prefer them over
  raw `wrangler` / `ruby` commands.
- Everything else at the repo root (`reference/`, screenshots, `poline.html`,
  `scratch.html`, etc.) is workspace material. Never shipped.

## Day-to-day

```sh
npm run dev             # builds Bulgarian data if missing, then `wrangler dev` on :8788
npm run dev:ntfy        # same as `dev`, but lets the Worker fire ntfy pushes
npm run build           # regenerate public/data/bg/** from upstream OSIS XML
npm run deploy          # worker:deploy && site:deploy

# lower-level entry points (still available)
npm run worker:dev      # plain wrangler dev, no build gate (ntfy disabled)
npm run worker:dev:ntfy # plain wrangler dev, ntfy enabled (reads .dev.vars)
npm run worker:deploy   # publish the Worker (and its [assets] bundle of public/)
npm run worker:tail     # live tail of the deployed Worker
npm run site:deploy     # publish public/ to Surge
```

`worker:dev` passes `--var LEM_NTFY_DISABLED:1`, which the Worker honors as a
hard skip on the ntfy publish step. This keeps local logs free of the 403 noise
that an anonymous (or stale-token) publish to the reserved topic would otherwise
emit. `worker:dev:ntfy` omits that override, so a `.dev.vars` carrying valid
`NTFY_TOPIC`/`NTFY_TOKEN` actually pushes — useful when iterating on the
notification body or routing.

`npm run dev` gates the build on the presence of `public/data/bg/gb-bulveren/Gen.json`.
Since that file is committed, a fresh clone skips straight to `wrangler dev`.
`npm run build` exists for when you change the parser, repin the upstream commit,
or otherwise need to regenerate the verse JSON.

Local dev needs a `.dev.vars` at the repo root:

```text
YVP_APP_KEY="..."
NTFY_TOPIC="lem-rodeo-popup"             # the reserved topic on ntfy.sh
NTFY_TOKEN="tk_..."                      # ntfy access token; required for the locked-down topic
```

Pull these from 1Password rather than typing/pasting; never commit them
(gitignored already).

### Setting Worker secrets in prod

Use the explicit invocation — a bare `npx wrangler ...` may resolve a
different binary on first run:

```sh
RP_IGNORE_GLOBAL_LIBVIPS=1 npx --yes wrangler@latest secret put YVP_APP_KEY
RP_IGNORE_GLOBAL_LIBVIPS=1 npx --yes wrangler@latest secret put NTFY_TOPIC
RP_IGNORE_GLOBAL_LIBVIPS=1 npx --yes wrangler@latest secret put NTFY_TOKEN
RP_IGNORE_GLOBAL_LIBVIPS=1 npx --yes wrangler@latest secret list
```

A successful upload ends with `✨ Success! Uploaded secret X`. A line that
ends in `✖ Enter a secret value:` was cancelled — nothing was written and
nothing was overwritten. Secrets are read live by the Worker — no redeploy
needed after a `secret put`.

**Paste the bare value, not a 1Password reference URL or any decorative
quoting.** Wrangler stores whatever bytes arrive on stdin verbatim; an
`op://` reference, surrounding quotes, or an example placeholder will be
saved as the literal secret.

## Bulgarian translations

The two Bulgarian Bibles aren't on YouVersion, so the Worker serves them
from pre-parsed JSON shipped as static assets:

- **Source** — pinned to commit `252c53a7e51916f6f2bf329b477f1ca6f2016b15`
  in [gratis-bible/bible](https://github.com/gratis-bible/bible) (`bg/`):
  `bulcarigradnt.xml` (Tsarigrad NT, 1871) and `bulveren.xml` (Veren, 2000).
- **Parser** — `scripts/build_bulgarian.rb`, Ruby + Nokogiri. Strips notes
  and titles, walks `osis:verse[@osisID]`, writes one JSON file per book to
  `public/data/bg/<bibleId>/<OsisBook>.json` keyed by `"chapter.verse"`.
- **Worker adapter** — `gratisBiblePassage()` in `workers/youversion-proxy.mjs`,
  dispatched when `bibleId.startsWith("gb-")`. Reads the book's JSON via
  `env.ASSETS.fetch(...)`, looks up the verse, returns the same shape as
  `sefariaPassage()`. OSIS book tokens come from `OsisBookByBibleBookId`;
  the Bulgarian citation label (e.g. *Йоан 3:16*) comes from
  `BulgarianBookNames`.
- **NT-only fallback** — Tsarigrad has no OT books. The adapter throws
  `YouVersionError(404)` on those, and the client's `tryTranslation` loop in
  `index.html` falls through to the next translation in the language (Veren
  is listed first in the `bg` arm, so OT verses succeed without flicker).

Re-run `npm run build` only when the pinned commit changes or the parser
itself is edited.

## Translation year metadata

Every entry in `TranslationCatalog` (and `BaselineTranslation`) in
`public/index.html` carries a `year` string — `"2011"`, `"~1008"`, or
`"1899–1903"` for ranges; empty string when unknown. `translationName()`
appends it parenthetically to the title (`Westminster Leningrad Codex
(~1008)`), and `translationFromVerse()` threads the catalog year into the
runtime translation object so the popup pulls from our table rather than
the upstream API (which doesn't carry one).

## Local ntfy subscriber (mac)

A LaunchAgent on the dev machine subscribes to the same topic the Worker
publishes to and surfaces each message as a native macOS notification. None
of this is checked into the repo; it lives under `~/Library/`. Documenting
it here so the next agent doesn't have to do session archaeology.

**Files:**

- `~/Library/LaunchAgents/sh.ntfy.subscribe.plist` — label `sh.ntfy.subscribe`,
  `RunAtLoad` + `KeepAlive`, throttle 10s. Logs (stdout + stderr merged) to
  `~/Library/Logs/ntfy-subscribe.log`.
- `~/Library/Application Support/ntfy/client.yml` — ntfy CLI config. Holds
  `default-host`, `default-token` (read from
  `op://Private/ntfy - lem.rodeo access token/credential`), and the
  `subscribe:` list (currently one entry, `topic: lem-rodeo-popup`). Mode
  `0600`. Tracked by chezmoi.
- `~/Library/Application Support/ntfy/notify.sh` — message handler invoked
  by the CLI. Uses `terminal-notifier -open ... -sound Glass -group ntfy-$topic`.
- Binary: `~/.local/bin/ntfy` (v2.22.0+). Installed manually from the
  upstream tarball, not via Homebrew, so it stays on the user's PATH without
  Cellar churn.

**Subscriber command (the LaunchAgent runs this):**

```sh
~/.local/bin/ntfy subscribe \
  --config "$HOME/Library/Application Support/ntfy/client.yml" \
  --from-config
```

**Operate it:**

```sh
launchctl unload ~/Library/LaunchAgents/sh.ntfy.subscribe.plist
launchctl load   ~/Library/LaunchAgents/sh.ntfy.subscribe.plist
launchctl list | grep sh.ntfy.subscribe          # PID + last exit code
tail -f ~/Library/Logs/ntfy-subscribe.log         # success is silent
```

**Updating the token without ever printing it:**

```sh
CLIENT_YML="$HOME/Library/Application Support/ntfy/client.yml"
{
  cat <<'HEAD'
default-host: https://ntfy.sh
HEAD
  printf 'default-token: '
  op read "op://Private/ntfy - lem.rodeo access token/credential"
  cat <<'TAIL'

subscribe:
  - topic: lem-rodeo-popup
    command: '"$HOME/Library/Application Support/ntfy/notify.sh"'
TAIL
} > "$CLIENT_YML"
chmod 600 "$CLIENT_YML"
launchctl unload ~/Library/LaunchAgents/sh.ntfy.subscribe.plist
launchctl load   ~/Library/LaunchAgents/sh.ntfy.subscribe.plist
```

**Subscriber gotchas:**

- **Silence is success.** `ntfy subscribe` only writes to the log on
  warnings/errors; a healthy long-poll connection emits nothing. If the
  log stops growing right after a reload, that's the success signal.
- **403 forbidden in the log = topic name or token is wrong.** The locked
  topic refuses anonymous reads. Cross-check `subscribe[].topic` in
  `client.yml` against `NTFY_TOPIC` in the Worker, and confirm
  `default-token` matches the 1Password item.
- **The token in `client.yml` is the same `tk_…` the Worker uses.** Both
  the publish side (Worker) and the subscribe side (this LaunchAgent) need
  it because the topic is locked for both directions on the Supporter tier.
  Rotating it means: update 1Password, run `wrangler secret put NTFY_TOKEN`,
  rewrite `client.yml` (snippet above), reload the LaunchAgent.
- **chezmoi tracks the config.** When you edit `client.yml` directly, run
  `chezmoi re-add` (or whatever the user's flow is) so the change is
  captured upstream — otherwise the next `chezmoi apply` will silently
  reset the topic/token.

## Known gotchas

- **`NTFY_TOPIC` must be a topic this account has reserved on ntfy.sh, and
  the Worker must publish with `Authorization: Bearer ${NTFY_TOKEN}`.** The
  current topic is `lem-rodeo-popup` (Supporter tier reservation, "Only I
  can publish and subscribe"). Without auth, ntfy 200s the publish but
  silently drops it, because the topic is locked. Without the right topic
  name, ntfy 200s the publish and routes it to a phantom topic with no
  subscribers. In both cases the Worker tail says "ok status=200" while
  the message vanishes — always cross-check the `topic` field in the ntfy
  response body when debugging delivery.
- **Worker publishes to `https://ntfy.sh/<topic>` (path form), not
  `https://ntfy.sh/` JSON-root.** The JSON-root form was observed to
  silently drop authenticated publishes from CF colo egress IPs even after
  topic reservation. Path form with header metadata works reliably.
- **Analytics Engine binding (`POPUP_LOG`) requires account-level
  enablement.** Cloudflare API code 10089 ("you need to enable Analytics
  Engine") at deploy time means the entitlement isn't on. The dashboard's
  "Create Blank Dataset" UI is misleading — it lets you create a dataset
  without enabling AE on the account. Per a closed wrangler issue, the
  entitlement sometimes provisions only after a delay or via a
  toggle-out/toggle-in. The Worker code guards with
  `env.POPUP_LOG?.writeDataPoint`, so the binding can be commented out as
  a stopgap if needed.
- **ntfy.sh free quota is per source IP.** Cloudflare Workers egress from
  shared colo IPs, so the 250-msg/day anonymous quota is shared with every
  other CF tenant in that colo. Authenticated publishes from a paid tier
  scope to the user's own per-tier quota (Supporter: 2,500/day) — but only
  if the topic is reserved by that user (see first gotcha).
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
