# Government handover security notes

This site is currently a static GitHub Pages application. It is suitable for publishing public emergency-support information, but it must not be treated as a secure private data store.

## What is protected in this build

- Marker and card text is HTML-escaped before rendering.
- Marker media URLs are restricted to expected local assets or validated HTTPS live streams.
- YouTube embeds are converted to controlled embed URLs.
- Cross-frame messages are restricted to the same site origin.
- External map/share links use `noopener`/`noreferrer` where appropriate.
- Entry pages define a baseline Content Security Policy and strict referrer policy.
- Offline cache versioning is bumped so deployed clients refresh the hardened files.

## What cannot be protected on GitHub Pages

No static website can stop visitors from copying delivered code, JavaScript data files, map points, contact numbers, or browser-cached assets. Browser dev tools, page source, network logs, and the service-worker cache can all expose files that are required for the app to run.

If any point data, personal contact, operational deployment detail, or route information is not intended for public distribution, do not publish it in this repository or in GitHub Pages assets.

## Production recommendations before official handover

- Keep only public, approved emergency information in the static site.
- Move restricted or changing operational data behind a government-controlled API with authentication, authorization, audit logs, rate limits, and server-side validation.
- Serve production through infrastructure that can set HTTP security headers, including `Content-Security-Policy`, `X-Content-Type-Options`, `Permissions-Policy`, and `Strict-Transport-Security`.
- Establish a named data owner for each category: hospitals, ambulances, toilets, water, police, hirkani, mukkam, and charanseva.
- Require field verification timestamps for emergency coordinates and contact numbers.
- Keep a rollback plan and daily data refresh process during the Wari period.
- Avoid committing API keys, private phone lists, credentials, or draft/unverified operational documents to this public repo.
