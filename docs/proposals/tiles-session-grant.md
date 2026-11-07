# Tiles session grant

Status: proposal, one of the ways in [Ways to offer Photorealistic 3D Tiles](https://github.com/foss-earth/research/blob/main/3D_tiles/implementation-options.md). Nothing in this document is implemented. The proxy in [Accounts and hosted basemaps](accounts-and-hosted-basemaps.md) is another way, not a rejected one.
Date: 2026-11-03.

This is the shared-key session grant. A person signs in and spends a balance.
The meshes go from their device to Google. The own-key path (`?gkey=`) wins
over a signed-in session for that visit. Other ways, including the proxy,
can ship beside this one. They do not share its Google key.

## Intended result

A person signs in with Google. The account starts with one free tiles
session. Saving a card adds one more. Buying credits adds more. While a
session is granted, Earth, the campus tour, and flight load Photorealistic
3D Tiles the same way a pasted Maps key does: the renderer calls
`tile.googleapis.com` directly.

When the balance cannot pay for another session, the next grant is refused
and flat maps keep working. One root request covers a session of meshes.
Google's pages put that window at three hours. The client keeps the session
until a tile request is rejected, then the next grant costs another unit.

No process on a laptop forwards tile bytes. The only server code is Firebase
Auth, Firestore, two Cloud Functions, and Stripe.

## What Google actually bills

The measurement and the quota rule are [How Google bills Photorealistic 3D Tiles](https://github.com/foss-earth/research/blob/main/3D_tiles/google-side-billing.md). The [red team](https://github.com/foss-earth/research/blob/main/3D_tiles/google-side-billing-red-team.md) argues that setting the daily quota to the sum of outstanding sessions makes that sum the copied-key budget, refilled every Pacific day. Confirm the SKU count on a billing export before treating the retail price as settled.

One session is one successful `root.json` request, SKU `C6E1-98B2-DBD0`. The published global price is $6 per 1,000 after 1,000 free events a month, then $5.10, $4.20, $3.30, and $2.40. The usage page does not count renderer mesh requests against the daily root quota. The SKU page's own phrase is still "a request that returns a 3D tile," which is why the export has to come first.

A root URL looks like this. Every child request sends that same key plus the `session` parameter Google put on the child URI.

`https://tile.googleapis.com/v1/3dtiles/root.json?key=KEY`

A key that can fetch the meshes can open another root. Google does not sell a narrower credential. The project daily root quota is the Google-side ceiling, and it resets at midnight Pacific. The published default is 10,000 roots a day, about $60 at the first paid tier, every day. Set the quota to the sum of `sessionsRemaining` instead, and lower it when that sum falls. A quota cannot be one person's balance: the number is shared by the whole project.

## Why this shape

Cesium ion's Google tiles work the same way. `GET /v1/assets/{id}/endpoint`
returns a root URL that already contains a key. Quest and Unreal apps then
download meshes from Google. Ion's own terrain is the part they host.
Glider Sim, WorldLens, Purdue CollabXR, TwinCity, and the E1 broadcast
scenes all take that path. The studio holds the ion account. The person in
the headset does not.

The product difference is the wallet. A foss-earth account is a Google
login, a balance, and a grant. The person never creates a Cloud project.

Proxying the meshes would put every glTF on a path the laptop cannot carry
and would add a round trip to every tile. The grant function runs once per
session and returns a URL. It does not read or write a tile body.

## Ownership

| Piece | Where it runs | Repository |
| --- | --- | --- |
| Google login, wallet, Stripe customer | Firebase Auth, Firestore | new `foss-earth/accounts` functions, or a `functions/` directory in `accounts/` if that repo is kept |
| `createTilesSession` and the Stripe webhook | Cloud Functions | same |
| Sign-in button, balance, buy, card | `@foss-earth/auth` | `foss-earth/auth` |
| Use a granted key as the normal Maps key, and renew only through the grant | `foss-earth/engine` | `@foss-earth/engine` |
| Account tab, call the grant unless this visit passed `?gkey=` | `foss-earth/app`, `UMN-VR/tour`, `0SFS/fly` | those apps |
| This decision record | `foss-earth/docs` | this file |

Do not deploy the SQLite account process or the `/v1/3dtiles/` proxy from
the previous spec. `@foss-earth/auth` becomes the Firebase client. It does
not implement PKCE, and it does not hold a provider client secret.

## Providers

Version 1 enables Google only. Firebase Auth is the identity provider.
Microsoft, GitHub, and email link are switches in the same Firebase project
when those OAuth apps exist. They do not get a second account system.

The apps are cross-origin isolated (`COOP: same-origin`, `COEP: require-corp`).
Sign-in is a full-page redirect (`signInWithRedirect` and `getRedirectResult`).
A popup is not used. Authorized domains are the three published sites and
localhost.

## Money

Balances are integers. One unit is one root session. The client cannot write
the balance.

| Event | Units |
| --- | --- |
| First sign-in | +1, once |
| Card saved | +1, once |
| Stripe payment of `amountCents` | + `floor(amountCents / retailCentsPerSession)` |

`retailCentsPerSession` lives in function config. The starting value is `2`
(two cents a session). At Google's $6 per thousand, the cost of a session is
about 0.6 cents, so two cents is the retail price until a billing report
says otherwise. Purchases are whole dollars through Stripe Checkout. A
one-dollar purchase adds 50 sessions at that price. Card networks take a
fixed fee of about 30 cents, so the product does not charge a few pennies
to a card. The penny price is the debit inside the wallet.

The signup grant is one session, not one dollar. One dollar of list-price
usage is more than a hundred roots.

## Data

Firestore. Rules deny every client write.

`users/{uid}`

| Field | Type |
| --- | --- |
| `email` | string |
| `createdAt` | timestamp |
| `sessionsRemaining` | int |
| `signupGrantApplied` | bool |
| `cardGrantApplied` | bool |
| `stripeCustomerId` | string or absent |

`grants/{grantId}`

| Field | Type |
| --- | --- |
| `uid` | string |
| `attemptId` | string, from the client, unique per attempt |
| `createdAt` | timestamp |
| `rootUrl` | string, the URL that was returned |

`grantId` is a hash of `uid` and `attemptId`. A retry of the same attempt
returns the stored URL and does not debit again. The client keeps
`attemptId` in `sessionStorage` until the tiles root has loaded, then
rotates it.

The client may read `users/{uid}` and nothing else.

## `createTilesSession`

HTTPS Cloud Function. The caller sends a Firebase ID token and `attemptId`.

1. Reject a missing or bad token with 401.
2. If `grants/{hash}` exists, return its `rootUrl` and the current balance.
3. In a transaction, read `users/{uid}`. Create the document on first use
   and add the signup grant inside that same transaction.
4. If `sessionsRemaining` is 0, return 402 `{ "error": "balance", "sessionsRemaining": 0 }` and do not create a grant.
5. Subtract one. Write the grant. Return 200:

```json
{
  "rootUrl": "https://tile.googleapis.com/v1/3dtiles/root.json?key=KEY",
  "sessionsRemaining": 12
}
```

The function reads `GOOGLE_TILES_KEY` from Secret Manager. It does not call
`tile.googleapis.com`. The browser does.

The key is restricted to the Map Tiles API and to nothing else. It has no
referrer restriction and no IP restriction. The Maps Platform FAQ lists Map
Tiles as an IP-restricted web service, and a referrer restriction fails on
that class of API. An IP allow-list would block the browser, because Google
sees the visitor's address. A key the browser can use for meshes is
unrestricted by application, which is why the daily root quota has to be
the sum of outstanding sessions rather than the default 10,000.

Version 1 is the websites. A native or headset build would use a key of the
same kind. A second key in this project shares the same daily root quota.

## Stripe

Use Stripe Checkout and a webhook function. Test mode until a real payment
has been refunded on purpose.

- `createCheckout` verifies the ID token, creates or reuses the Stripe
  customer, and returns a Checkout URL for a whole-dollar price. The success
  URL comes back to the app.
- The webhook listens for `checkout.session.completed`. A payment adds
  units. A setup-mode session, used by "Save a card", sets
  `cardGrantApplied` and adds one unit if it was false. Both writes are
  idempotent on the Stripe event id.
- The webhook is the only writer of purchased units. The client does not
  add units after the redirect.

Firebase's Stripe extension is acceptable for the webhook and the customer
document if it keeps those two writes idempotent. The session grant stays a
function we own.

## Client

`@foss-earth/auth` exports three things:

- `signIn()` / `signOut()` / `settle()`, using Firebase redirect auth.
- `createAccountPanel()`, the Account tab. Signed out: one "Sign in with
  Google" button. Signed in: the email, the remaining sessions, "Save a
  card" if no card grant yet, "Buy credits", and "Sign out".
- `requestTilesSession(attemptId)`, which calls `createTilesSession` with
  the ID token.

The Account tab uses the existing classes `foss-earth-status-section`,
`foss-earth-choices`, `foss-earth-choice`, and `foss-earth-choices__note`.
It is a real tab, on Earth, the tour, and flight, in the same place the
proxy spec put it.

`foss-earth.auth` from the proxy client is not used. Firebase persists its
own session. Clearing site data in the Browser data tab drops that session
and does not restore it when API keys are kept.

### When the app asks for a session

After the redirect settles, and only if this visit did not pass `?gkey=`
(the `foss-earth.visit-google-key` flag already records that):

1. Call `requestTilesSession`.
2. On 200, pass the key from `rootUrl` into the existing device-key tiles
   path. Do not use the hosted proxy credential.
3. On 402 or 401, leave the key empty. Flat maps load. The log says to open
   Account.
4. On a network failure, leave the key empty. Flat maps load.

The engine must not renew an expired Google session by fetching
`root.json` itself. `autoRefreshToken` stays off for a granted key. A
rejected Google tile calls `requestTilesSession` with a new `attemptId`.
That call debits another unit. Do not start that call from a three-hour
timer while tile requests are still succeeding. A 402 stops the tiles
runtime with the same pause behavior flat maps already have.

A `?gkey=` visit never calls the function. A saved device key does not
replace a granted session. Those two rules are already how the visit flag
and `ignoreSavedGoogleKey` were aimed. Point them at the granted key.

## App wiring

Earth calls the grant from `createGlobeApp` before `createEarthBrowserRuntime`,
unless the visit flag is set. The tour gets it by mounting Earth. Flight
calls the same grant before `createBabylonRuntime`. The Account tab is the
panel from `@foss-earth/auth`.

The granted key is memory for that page. It is not written into
`map.source.googleKey` and it is not part of a settings export.

## Local development

Firebase emulators for Auth, Firestore, and Functions. The function in the
emulator returns a root URL only when `GOOGLE_TILES_KEY` is set in the
emulator environment. Tests do not call Google. They assert the debit, the
402, and the idempotent retry.

`npm run dev` on an app still appends `?gkey=` from `GOOGLE_3D_TILES_KEY`.
That visit does not spend a session. `npm run llm-dev` passes no key and
does not call the grant unless the tester is signed in against the emulator.

## Acceptance

- A signed-out visitor sees flat maps and an Account tab. No request is
  made to `tile.googleapis.com` by the app.
- First Google sign-in creates `users/{uid}` with `sessionsRemaining` 1.
- The next grant returns a root URL whose host is `tile.googleapis.com` and
  whose query contains `key`. The balance becomes 0. A second grant returns
  402. Mesh URLs in the browser are on `tile.googleapis.com`, not on a
  foss-earth host.
- Retrying the same `attemptId` does not debit twice.
- Two overlapping grants for one user cannot drive the balance negative.
- After a granted session, a 403 causes one new grant call and not a silent
  root fetch with the old key.
- `?gkey=` on this visit loads tiles and does not call `createTilesSession`.
- Saving a card once moves the balance from 0 to 1. A second setup event
  does not.
- A $1 test payment adds 50 sessions at the starting retail price. Replaying
  the webhook does not add them again.
- Clearing browser data removes the Firebase session. Keep API keys does
  not bring it back.
- The Google key is not in the app repositories. Its API restriction is
  Map Tiles API only. The project's daily root quota equals the sum of
  outstanding sessions, not 10,000.

## Build order

1. Firebase project, Google provider, Firestore rules, the user document
   and the grant transaction. Emulator tests for debit, 402, and retry.
2. `@foss-earth/auth` redirect sign-in and the Account tab. Wire it into
   Earth behind the visit flag.
3. Engine: granted key uses the device-key plugin with automatic root
   refresh off, and a 403 asks the app for a new grant.
4. Stripe test mode: Checkout, the webhook, the card grant.
5. The same grant call in flight. The tour follows Earth.
6. API-restrict the Maps key to Map Tiles API. Set the daily root quota to
   the sum of outstanding sessions.
7. Leave the proxy process undeployed.

## Out of scope

A native or headset client. Microsoft, GitHub, and email providers.
Metering each mesh. A payment network that charges a card a few cents.
Raising Google's quota. Storing tiles. The laptop as a host.
