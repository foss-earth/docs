# Accounts and hosted basemaps

Status: implemented in the working trees. The account service is `accounts/`, the browser client is `auth/`, and Earth, the campus tour, and flight use it. Nothing here is committed or deployed, and `https://login.foss.earth` is not running.
Date: 2026-10-27.

This replaces the identity and grant parts of
[Hosted access to Google Photorealistic 3D Tiles](https://github.com/foss-earth/research/blob/main/docs/proposals/hosted-google-tiles.md)
(2026-10-14). The forwarding rules, the Google policy constraints, and the
device-key path in that document still hold. Where the two disagree, this
document wins.

## Intended result

A person can sign in once, with GitHub, Google, Microsoft, or email, and that
sign-in works on the Earth app, the campus tour, and flight. While they are
signed in they can use Google Photorealistic 3D Tiles. They never receive the
Google Maps key, and a saved key on the device is not required.

Flat basemaps that need no key keep working when they are signed out, when
their quota is spent, and when the account service is down.

Someone who brings their own Google key can still pass `?gkey=` for that
visit. Development keeps doing that. A key left over in device settings does
not override a signed-in session.

## Why a server exists

The three apps are static sites:

| App | Published origin | Dev origin |
| --- | --- | --- |
| Earth | `https://foss-earth.github.io/app/` | `https://localhost:3600/app/` |
| Campus tour | `https://umn-vr.github.io/tour/` | `https://localhost:8660/tour/` |
| Flight | `https://0sfs.github.io/fly/` | `https://localhost:7470/fly/` |

GitHub Pages cannot hold a client secret, send mail, or keep an IP-restricted
Google key. Map Tiles API keys are restricted by IP, not by HTTP referrer. A
referrer-restricted key is rejected. Google bills the Cloud project that owns
the key. A person's Google, GitHub, or Microsoft login does not move that bill
onto their account.

The [3D Tiles guide](https://developers.google.com/maps/documentation/tile/3d-tiles)
loads tiles from

`https://tile.googleapis.com/v1/3dtiles/root.json?key=YOUR_API_KEY`

and the renderer then requests every child with that same key. One successful
root request covers about three hours of tile downloads. Later downloads do
not count against the daily root quota. Opening or reloading starts a new
root request. The [Map Tiles policies](https://developers.google.com/maps/documentation/tile/policies)
allow a private or signed-in app, require the Google logo and the aggregated
`asset.copyright` line, and forbid storing the tile content. A pass-through
proxy respects that. A cache of the meshes does not.

So one process holds the provider secrets and the accounts. Browsers
authenticate to that process. The process adds the Google key when it
forwards `/v1/3dtiles/…`.

## Ownership

| Piece | Repository | Package |
| --- | --- | --- |
| Account service and tile proxy | new `foss-earth/accounts` | `@foss-earth/accounts` (server only; apps do not import it) |
| Browser sign-in client and account panel | new `foss-earth/auth` | `@foss-earth/auth` |
| Hosted versus device-key credential inside the tiles runtime | `foss-earth/engine` | `@foss-earth/engine` |
| Earth app mounts the panel and passes the credential | `foss-earth/app` | `foss-earth` |
| Tour does the same | `UMN-VR/tour` | the tour |
| Flight does the same | `0SFS/fly` | the flight app |
| Clearing a sign-in when site data is cleared | `foss-earth/ui` | `@foss-earth/ui` browser data |
| This decision record | `foss-earth/docs` | this file |

`@foss-earth/auth` is the common component. The three apps link it the same
way they link `@foss-earth/ui` (`file:../auth` in a side-by-side checkout).
It draws with the DOM, as the engine's panels do, so a host does not have to
be React. It does not import Babylon, the engine, or a host's settings
registry.

When those repositories exist, add them to
[the agent task index](../agent-start.md). Until then this file is the
contract.

## Decisions

1. One process, one stable public egress IP, one origin. The working name in
   this spec is `https://login.foss.earth`. The hostname is an operator
   choice. It must be a different origin from all three apps so their
   service workers do not intercept it, and so the Google key can be
   restricted to that process's egress IP.
2. Sign-in is OAuth 2.1 authorization code with PKCE, against that origin.
   The apps are public clients. They have client ids and redirect URIs. They
   have no client secret. Provider client secrets stay on the server.
3. The browser reaches the providers by a full-page redirect. Not a popup.
   The published apps send cross-origin isolation headers
   (`Cross-Origin-Opener-Policy: same-origin`). A popup cannot talk back to
   the page under that policy.
4. The auth-origin session is an HttpOnly cookie. Apps never see it. What an
   app stores is an access token and a refresh token for its own client id.
   Those tokens are not settings parameters, not query parameters after the
   code is consumed, and not part of a settings export.
5. A verified email is the account. GitHub, Google, Microsoft, and an email
   link that prove the same verified address are the same account. An
   unverified address never links and never creates an account.
6. Signing in is the entitlement for hosted Google 3D Tiles. There is no
   class code and no separate tiles grant. A per-account daily root budget,
   and the Cloud project's daily root quota, are what stop spend.
7. `?gkey=` on the current page still talks to Google directly with that
   key, and it wins over the signed-in session for that visit. A key only
   saved on the device does not. Signed out, the saved key works as it does
   today.
8. The proxy streams tile bytes and does not store them. It does not share
   one Google session across people.
9. CARTO stays a device key in this version. The entitlement name is
   `google-3d-tiles`. A later provider uses the same account and a new
   adapter. It does not get its own login.
10. Version one has a server CLI for quota, revoke, and disabling an
    account. It does not have a web admin, passwords, or billing.

## What the person sees

The account control sits with the other page controls the host already
opens from the shell (the Earth's **+** menu is the Earth host's place).
It shows **Sign in** when there is no session.

**Sign in** navigates to the account origin. That page offers four actions,
in this order: Google, GitHub, Microsoft, and an email field with **Email
me a link**. The copy on that page says what sign-in is for: using Google
3D Tiles on FOSS Earth apps. It does not ask for a password.

After a successful return, the control shows the email and **Sign out**.
Choosing Google 3D Tiles then loads through the proxy. The map status line
already used for a missing key stays the place where a refusal is explained.
A spent daily budget says that 3D Tiles are paused until the budget resets,
and that flat maps still work. A missing session does not blank the page.
The app stays on a raster basemap, as it does today with no key.

**Sign out** navigates to the account origin, which drops the cookie and
revokes that account's refresh tokens, then returns to the page the person
left. The next app does not silently sign them back in.

Signing in on one app and later opening another app on a different site
sends that second app through the account origin. The cookie is already
there, so the provider buttons are skipped and the second app comes back
signed in. That is the whole of "common" in this version. The sites do not
share `localStorage`. They share the account-origin cookie plus a fresh
token for each client id.

## Providers

The server talks to the providers. The apps only talk to the account origin.
Each provider has one client registration, with its redirect on the account
origin (`/callback/google`, `/callback/github`, `/callback/microsoft`).
The apps are not registered with Google, GitHub, or Microsoft.

| Provider | What the server checks | Account subject |
| --- | --- | --- |
| Google | OIDC authorization code. `iss` is Google's, `aud` is this client id, `exp` is in the future, `email_verified` is true. | Google `sub` |
| GitHub | OAuth code, exchanged with the server's client secret. The email used is the primary verified email from the emails API. No verified primary email: refuse, and say so. Scope is `read:user` and `user:email`. | GitHub user id |
| Microsoft | OIDC on `https://login.microsoftonline.com/common/v2.0`, app registration type "any organization's directory and personal Microsoft accounts". `email` must be present and verified. A personal account that returns no email is refused. | Microsoft `sub` |
| Email | The person types an address. The server stores a single-use random token, hashed, and sends a link to the account origin. The link lives 15 minutes. Following it proves the address. | the address itself |

The server discards the provider access token after it has read the subject
and the email. It does not keep a provider refresh token. It does not call
the provider again until the next sign-in.

Magic-link mail goes out through one HTTPS mail API configured with a server
token. The process does not run its own mail exchanger. The message contains
the link and nothing else the person must copy.

Rate limits, enforced before a provider or the mail API is called:

- 5 magic links per address per hour, 20 per IP per hour.
- 30 token exchanges per IP per minute.

A refusal is `429` with a short message. It does not reveal whether the
address already has an account.

## Accounts

An account is created the first time a provider returns a verified email
that no account has. A later sign-in with a different provider and the same
verified email attaches a new identity to that account. The check is the
normalized address: trim, lowercase the domain, and for email-link addresses
lowercase the whole address.

Identities are unique on `(provider, subject)`. An account may have several.
Unlinking is out of scope for version one; disabling the account is the
operator's tool. An account must be disable-able without deleting the row,
so a recreated provider identity does not mint a fresh quota.

The server stores:

| Record | Fields that matter |
| --- | --- |
| Account | id, created time, disabled time |
| Identity | account id, provider, subject, verified email, created time. Unique on provider + subject. |
| Browser session | id, account id, secret hash, expiry, revoked time. This is the auth-origin cookie. |
| Client | id (`earth`, `tour`, `fly`), display name |
| Redirect URI | client id, absolute URI |
| Authorization code | hash, client id, redirect URI, account id, PKCE challenge, expiry, used time |
| Access token | hash, account id, client id, expiry, revoked time |
| Refresh token | hash, family id, account id, client id, expiry, rotated time, revoked time |
| Magic link | hash, email, expiry, used time |
| Root spend | account id, UTC day, count |

Secrets are stored only as SHA-256 hashes. The database is one SQLite file
through Node's `node:sqlite`, on the server disk. One process opens it.
A second replica would be a second egress IP and a second Google key
restriction, which this version does not do. Restarting the process keeps
the file.

## Browser sign-in

Registered clients and redirect URIs:

| Client id | Redirect URIs |
| --- | --- |
| `earth` | `https://foss-earth.github.io/app/`, `https://localhost:3600/app/` |
| `tour` | `https://umn-vr.github.io/tour/`, `https://localhost:8660/tour/` |
| `fly` | `https://0sfs.github.io/fly/`, `https://localhost:7470/fly/` |

The tour's campus pages (`/tour/minneapolis/` and the others) are not
separate clients. The tour starts sign-in from whichever campus page is
open, and puts that page's path in `state`. The redirect URI is the tour
base. After the code is stored, the client navigates to the path from
`state` if it is a same-origin path under `/tour/`. Anything else is
ignored. Flight and Earth have one page each; `state` still carries a nonce.

### Starting

`@foss-earth/auth` `createAuthClient`:

```ts
createAuthClient({
  accountOrigin: "https://login.foss.earth",
  clientId: "earth",
  redirectUri: "https://foss-earth.github.io/app/",
  storage: localStorage,
});
```

`accountOrigin` is public. It is compiled into each app. It is not a secret
and it is not a `VITE_` key.

`signIn({ returnPath })`:

1. Create a PKCE verifier and a `state` nonce. Save both in `sessionStorage`
   for this tab.
2. Navigate to
   `{accountOrigin}/authorize?response_type=code&client_id&redirect_uri&code_challenge&code_challenge_method=S256&state&return_path`.
   `return_path` is the path and query the host wants back, with credentials
   already stripped (`gkey`, `key`, `googleKey`, `code`).

The account origin, if it has no session cookie, shows the provider page.
If it has one, it skips that page. Either way it redirects to `redirect_uri`
with `?code&state`.

### Returning

On load, if `code` and `state` are present and `state` matches the saved
nonce, the client POSTs to `{accountOrigin}/token`:

```json
{ "grant_type": "authorization_code", "code": "…", "redirect_uri": "…", "client_id": "earth", "code_verifier": "…" }
```

The response:

```json
{
  "accessToken": "…",
  "refreshToken": "…",
  "expiresAt": "…",
  "account": { "id": "…", "email": "…" },
  "entitlements": ["google-3d-tiles"],
  "quota": { "google-3d-tiles": { "remainingRootRequests": 40, "resetsAt": "…" } }
}
```

The client writes the tokens, the account, and the entitlement into
`localStorage` under one key, `foss-earth.auth`. It removes `code` and
`state` from the address bar with `history.replaceState`, the way `gkey` is
removed today. A mismatch, a reused code, or a network failure leaves the
person signed out and removes the query. It does not retry the code.

Access tokens last 15 minutes. Refresh tokens last 30 days and rotate on
every use. Reuse of a rotated refresh token revokes the whole family and
signs that client out. Refresh is `POST /token` with
`grant_type=refresh_token`. The client refreshes when the access token has
under a minute left, and once on a `401` from the tile proxy.

The auth-origin cookie is `fe_session`, HttpOnly, Secure, SameSite=Lax,
Path=/, 30 days, rotated when a sign-in creates it. SameSite=Lax is enough:
`/authorize` is a top-level GET, so the cookie is sent, and another site
cannot POST it.

Token responses send `Access-Control-Allow-Origin` set to the requesting
app origin, and only when that origin is one of the registered redirect
origins. `Access-Control-Allow-Headers` includes `content-type`. The token
endpoint does not accept cookies. `Access-Control-Allow-Credentials` is not
set.

### Sign-out

`signOut()` clears `foss-earth.auth` and navigates to
`{accountOrigin}/logout?post_logout_redirect_uri=…&client_id=…`. The server
revokes the browser session and every refresh token for that account, then
redirects back. The redirect URI must already be registered for that client.

### Site data

Clearing site data in the Browser data review deletes `foss-earth.auth`
along with the rest of that origin's `localStorage`. **Keep API keys** does
not keep the sign-in. The sign-in is not an API key. The Google and CARTO
device keys stay under that checkbox, as they do now
(`ui/src/browser/browserData.ts`).

## Hosted tiles

### Credential

`createGoogleTilesRuntime` in `engine/src/babylon/createTilesRuntime.ts`
takes a credential instead of only `apiKey`:

```ts
type GoogleTilesCredential =
  | { kind: "device-key"; apiKey: string }
  | {
      kind: "hosted";
      rootUrl: string;
      authorization(): Promise<string>;
    };
```

`device-key` is today's path. The root URL stays
`https://tile.googleapis.com/v1/3dtiles/root.json`. The host still builds
`GoogleCloudAuthPlugin` with `apiToken` set to that key, `autoRefreshToken`,
and `useRecommendedSettings`. An empty key still fails before any request.
The plugin's fetch wrapper, the cache bypass on root refresh, `errorTarget`,
and the copyright line stay as they are.

`hosted`:

- Builds the renderer with `rootUrl`, which is
  `{accountOrigin}/v1/3dtiles/root.json`.
- Does not register `GoogleCloudAuthPlugin`. That plugin would put
  `authorization()`'s token, or any stand-in, on the query string as `key`.
- Registers a FOSS Earth plugin. Its fetch sends `Authorization` from
  `authorization()`, does not add `key`, and does not send cookies.
  `fetchOptions.mode` stays `cors`.
- Sets `errorTarget` to 20 when the Google plugin would have, and leaves the
  existing settings override able to replace it afterwards.
- On `tile-visibility-change`, aggregates `asset.copyright` the way
  `GoogleAttributionsManager` does, so the logo and the data line stay.
- On a `401`, calls `authorization()` once more and retries that request
  once. A second `401`, or a `402`, is a hosted-access failure. The message
  is the quota or sign-in message, not "bad Google key".
- `redactTileUrl` still redacts `key`, `session`, `token`, and `api_key` in
  anything that does contain them.

`authorization()` returns the current `Bearer` access token, refreshing
first when it is inside its last minute. The tiles runtime calls it per
request rather than capturing one string at startup, so a refresh does not
rebuild the renderer.

Google's child URIs are root-relative and already carry `session`. The
renderer resolves them against `rootUrl`, so they come back to the account
origin. The proxy does not rewrite tileset JSON.

### Which credential the app uses

Resolved once when the globe is created, and again when the account client
reports a sign-in or sign-out:

1. A non-empty `gkey` (or legacy `key` / `googleKey`) on the current page's
   URL is `device-key` for this visit. This is the development path
   (`npm run dev` appends `GOOGLE_3D_TILES_KEY`).
2. Else a signed-in session whose entitlements include `google-3d-tiles` is
   `hosted`.
3. Else a non-empty saved `map.source.googleKey` is `device-key`.
4. Else there is no Google credential. Raster basemaps work. Choosing
   Google 3D Tiles shows the sign-in control.

A signed-in entitlement calls the same host-default hook a device key uses
today: `map.source.basemap` defaults to `google`, with the reason "the
signed-in account includes Google 3D Tiles". A saved basemap or a
`?mapSource=` value still wins (`engine/src/settings/mapRuntimeConfig.ts`).

The access token is not written to `map.source.googleKey`. That parameter
remains the person's own key, described as kept on the device and sent to
Google.

### Forwarding

`GET /v1/3dtiles/*` with `Authorization: Bearer <access token>`:

1. Resolve the token. Missing, unknown, expired, or revoked: `401`. Do not
   call Google. A disabled account is the same refusal.
2. The entitlement must include `google-3d-tiles`. Otherwise `403`, and do
   not call Google.
3. Refuse a path that is not under `/v1/3dtiles/`. Refuse a request that
   tries to choose a different upstream host. Delete a client-supplied `key`
   query parameter if one is present.
4. If the path is `/v1/3dtiles/root.json`, reserve one root request against
   that account's UTC-day count before calling Google. The store is the
   source of truth. When the remaining count is already zero, return `402`
   and do not call Google.
5. Forward to `https://tile.googleapis.com` with the same path and the
   remaining query, and set `key` to the server's key. Stream the response
   back, including status, `Cache-Control`, and `ETag`.
6. A non-success from Google does not spend the reserved root request.
   Spend it when Google returns a successful root response.
7. Child tileset and mesh requests check that the token is still acceptable
   and then forward. They do not change the root count.

Token checks for child requests may use an in-memory cache refreshed from
the store at least every minute. A root request always reads the store.
Disabling an account therefore stops further mesh requests within a minute,
including meshes already inside a three-hour Google session.

The browser's tile responses need CORS for the app origins:
`Access-Control-Allow-Origin` is the requesting origin when it is
registered, `Access-Control-Allow-Headers` includes `authorization`, and
preflight `OPTIONS` is answered without calling Google. Responses also send
`Cross-Origin-Resource-Policy: cross-origin`, because the apps are
cross-origin isolated and a tile response without that header is dropped
before the renderer sees it.

Log the path, status, account id, and byte count. Do not log the Google
key, any bearer token, the `Authorization` header, a magic-link token, or a
URL that still contains `key`.

### Quota

The default budget is 40 successful root requests per account per UTC day.
The first 24 hours after the account is created are capped at 10, so a
batch of new accounts cannot spend the daily Cloud quota in one hour. Both
numbers are server configuration, not constants in the client.

The Cloud project's daily root-request limit is set lower than the number
that would be an acceptable surprise bill, and lower than or equal to what
the free monthly Photorealistic 3D Tiles amount can absorb. That limit is
the backstop if the per-account math is wrong. A billing budget alert is
email only. It is not a cap.

`402` body:

```json
{ "error": "quota", "resetsAt": "…" }
```

The client surfaces that as the map status. It does not retry the root.

## Server routes

All of these are on the account origin.

| Method and path | Purpose |
| --- | --- |
| `GET /authorize` | Start or continue sign-in. Sets no token. Redirects. |
| `GET /callback/{google,github,microsoft}` | Provider redirect. Creates or links the account, sets `fe_session`, redirects to the app with `code`. |
| `GET /email/sent` | Tells the person to check their mail. |
| `GET /email/verify?token=` | Consumes a magic link, then continues as a callback. |
| `POST /token` | Exchange a code or rotate a refresh token. CORS, no cookie. |
| `GET /logout` | Revoke the cookie session and the account's refresh tokens. Redirect back. |
| `GET /v1/3dtiles/*` | Tile proxy. Bearer access token. |
| `POST /cli` is not HTTP | The CLI opens the SQLite file on the machine. It is not a route. |

`/authorize` rejects an unknown `client_id` or a `redirect_uri` that is not
registered for that client, before it redirects anywhere. The error is shown
on the account origin. It is not reflected to an arbitrary URI.

## CLI

On the server machine:

```
accounts quota set --email person@example.com --daily-roots 40
accounts account disable --email person@example.com
accounts account enable --email person@example.com
```

Disabling revokes refresh tokens and browser sessions immediately. Mesh
requests stop within a minute. The CLI prints the email and the new state.
It does not print tokens.

## Operator setup

Before the first signed-in tile request:

1. A machine with a stable egress IPv4, DNS for the account hostname, and
   TLS. Node.js 22 or newer, the same floor as the apps.
2. A Cloud project key used only by this process. API restriction: Map
   Tiles API. Application restriction: that egress IP. A different key from
   any key people use with `?gkey=`.
3. On that key, a daily root-request quota that is acceptable if it is
   fully used. For the first public week, a few hundred a day is the right
   order. Confirm the free monthly amount in the billing console before
   raising it.
4. A billing budget alert. Notification only.
5. One Google OAuth client, one GitHub OAuth app, one Microsoft app
   registration, and one mail API token, as environment variables on the
   process. The Google Maps key is a separate variable from the Google
   OAuth client secret.
6. Redirect URIs registered for the three published origins and the three
   dev origins in the table above. No other origin.
7. Confirm a tile request from an unregistered origin is refused before
   Google is called.

The proxy's bandwidth is a separate bill. Every mesh is streamed through
it. A campus walk is the expected first cost. A long flight moves more
data. The daily root cap bounds how often that stream starts. It does not
bound the size of one session. Watch the machine's egress for the first
weeks and lower the daily root quota if a single session is larger than
expected.

Environment variables the process requires, and never the apps:

| Variable | Use |
| --- | --- |
| `GOOGLE_TILES_KEY` | Map Tiles API key, IP-restricted |
| `GOOGLE_OAUTH_CLIENT_ID` / `GOOGLE_OAUTH_CLIENT_SECRET` | Sign in with Google |
| `GITHUB_OAUTH_CLIENT_ID` / `GITHUB_OAUTH_CLIENT_SECRET` | Sign in with GitHub |
| `MICROSOFT_OAUTH_CLIENT_ID` / `MICROSOFT_OAUTH_CLIENT_SECRET` | Sign in with Microsoft |
| `MAIL_API_TOKEN` / `MAIL_FROM` | Magic links |
| `ACCOUNT_ORIGIN` | This process's public origin |
| `ROOTS_PER_DAY` / `ROOTS_FIRST_DAY` | Defaults 40 and 10 |

## Phases

| Phase | Ships | A person can |
| --- | --- | --- |
| 1 | Account process, the four providers, `@foss-earth/auth`, the panel on Earth, the tour, and flight | Sign in on one app and already be signed in on the next. No tile spend yet. Raster maps unchanged. |
| 2 | Tile proxy, engine hosted credential, quota | Choose Google 3D Tiles while signed in, with no API key. `?gkey=` still talks to Google directly. |

Phase 1 is deployable on its own and is the integration test for redirects,
isolation headers, and the three hosts. Phase 2 does not change the sign-in
flow. It adds the credential and the proxy.

CARTO-through-the-account is not a phase of this spec. It is a new adapter
on the same entitlement list when someone is ready to pay for that proxy's
bandwidth.

## Acceptance

Phase 1 is done when all of these hold:

- Google, GitHub, Microsoft, and an email link each create an account, and
  a second provider with the same verified email attaches to it instead of
  creating another.
- An unverified GitHub email does not create or link an account.
- Signing in on Earth and then opening the tour completes without showing
  the provider buttons again.
- Sign-out on Earth requires the provider buttons again on flight.
- The address bar does not keep `code` or `state`.
- `foss-earth.auth` is absent from a settings export. Clearing site data
  removes it. **Keep API keys** still keeps a saved Google key.
- No provider client secret and no Google Maps key appears in any app
  bundle.
- Tests cover PKCE rejection, code reuse, refresh rotation, and refresh
  reuse revoking the family. They use stand-in provider tokens, not live
  providers.

Phase 2 is done when all of these hold, in addition:

- A signed-in page requests `tile.googleapis.com` only from the proxy's IP.
  The browser's tile requests go to the account origin and carry
  `Authorization`, not `key`.
- The Google key does not appear in the app bundles, the page URL, the
  settings export, `localStorage`, or a failure log.
- Spending the day's root budget returns `402` and stops a further root
  request. Disabling the account stops mesh requests within a minute.
- A child-tile request does not change the root count.
- A request outside `/v1/3dtiles/`, or from an origin that is not
  registered, does not call Google.
- `?gkey=` still loads tiles from Google with that key, including while
  signed in.
- With no session and no device key, all three apps still open on a raster
  basemap.
- The Google logo and the copyright line are still shown.
- A tile response is visible in a cross-origin-isolated page.
- Tests cover the proxy rules and the hosted fetch plugin with stand-in
  HTTP. They do not call Google.

## Out of scope

- Passwords, password reset, and "email me a code" as a second factor.
- A web page for creating accounts or editing quotas. The CLI is the admin.
- Charging people, plans, or a Stripe-style customer.
- Unlinking one provider while keeping the account.
- Sharing one Google root session across several people.
- Storing or rehosting tile meshes.
- Proxying CARTO, or any raster basemap, in this version.
- Putting the access token into `map.source.googleKey` or into a multiplayer
  invitation. Flight's existing opt-in to share `gkey` is unchanged and
  still shares only a device key the person already has.
- Popup or iframe silent sign-in.
- A second server instance.

## Current code this has to land on

Observed in the working copies on 2026-10-27:

- `engine/src/babylon/createTilesRuntime.ts` builds the renderer with
  `https://tile.googleapis.com/v1/3dtiles/root.json` and requires `apiKey`.
  It registers `GoogleCloudAuthPlugin` with that string as `apiToken`, then
  wraps the plugin's `fetchData`. Hosted mode is a branch beside that
  plugin, not a patch inside it.
- `engine/src/settings/catalogue/map.ts` stores the device secret as
  `map.source.googleKey` (`sensitive: true`). Leave that parameter. Do not
  add a token parameter next to it.
- `resolveMapRuntimeConfig` in `engine/src/settings/mapRuntimeConfig.ts`
  treats a host-supplied or saved key as the reason to default the basemap
  to Google. The signed-in entitlement is a second reason, through the same
  `setHostDefault` call.
- `app/src/app/createGlobeApp.ts` reads `options.googleApiKey` and the saved
  key. The Earth host resolves the credential before that, and passes
  either the device key or the hosted credential.
- `ui/src/browser/browserData.ts` clears site storage and optionally keeps
  the Google and CARTO keys. It learns the `foss-earth.auth` key.
- Flight documents the device key in `fly/README.md`. The public flight
  build gains the account origin and the panel. It does not gain a compiled
  Google key.
- The 2026-10-14 spec's class invite, friend invite, and `umn.edu`-only
  ID-token grant are not built. Do not add them beside this sign-in.
