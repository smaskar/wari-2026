# Wari 2026 Link And Filter Audit

Audit date: 2026-07-04
Scope: current local repo state after My Maps + MEMS roster merge.

## Summary

- Production entry pages checked: `index.html`, `app.html`, `map.html`, `offline.html`, `404.html`.
- Main local links/assets checked: 67.
- Missing production local links/assets: 0.
- Service worker local cache entries checked: 55.
- Missing service worker cache entries: 0.
- External Leaflet CDN links checked with `curl -I`: both returned HTTP 200.
- Local server smoke check: `app.html` returned HTTP 200.
- Post-fix data build status: 596 points, 89 distinct ambulance vehicles, 120 ambulance pins.
- New MEMS roster contact file is loaded by both `app.html` and `map.html`.
- Fix applied: desktop-to-phone filter sync now preserves `doc`, `water`, `toilet`, `hirkani`, `ambulance`, and `halt` filters.
- Fix applied: zero-result subfilter chips are disabled for the selected palkhi.
- Fix applied: desktop map search now combines with the active type filter instead of overriding it.

## Production Link Status

All production references exist on disk:

- `index.html` -> `app.html`, `map.html`, `assets/js/shell.js`, `assets/css/shell.css`
- `app.html` -> all point data scripts, route scripts, CSS, images, officials, dignitaries, `wari-ambulance-contacts-2026.js`
- `map.html` -> all point data scripts, route scripts, CSS, officials, `wari-ambulance-contacts-2026.js`
- `offline.html` -> `assets/css/offline.css`
- `sw.js` cache list -> all local files exist

External dependencies:

- `https://unpkg.com/leaflet@1.9.4/dist/leaflet.css` -> HTTP 200
- `https://unpkg.com/leaflet@1.9.4/dist/leaflet.js` -> HTTP 200

Note: first-time map rendering still depends on Leaflet CDN availability. After the service worker caches it, the app has a better offline fallback.

## Filter Counts

### Both Palkhis

| Filter | Count |
|---|---:|
| All non-water points | 403 |
| Ambulance pins | 120 |
| Ambulance vehicles | 89 |
| ALS ambulance vehicles | 18 |
| BLS ambulance vehicles | 38 |
| 102 ambulance vehicles | 35 |
| 108 ambulance vehicles | 4 |
| Doctor / health points | 153 |
| PHC | 38 |
| Rural / subdistrict hospital | 23 |
| Private hospital | 86 |
| HBT | 6 |
| ICU / trauma | 17 |
| Water total | 193 |
| Water actual | 55 |
| Water approximate | 138 |
| Toilet points | 23 |
| Hirkani points | 67 |
| Halt total | 108 |
| Mukkam | 29 |
| Visava | 79 |

### Sant Dnyaneshwar Maharaj Palkhi

| Filter | Count |
|---|---:|
| All non-water points | 205 |
| Ambulance pins | 73 |
| Ambulance vehicles | 51 |
| ALS ambulance vehicles | 8 |
| BLS ambulance vehicles | 22 |
| 102 ambulance vehicles | 22 |
| 108 ambulance vehicles | 4 |
| Doctor / health points | 62 |
| PHC | 18 |
| Rural / subdistrict hospital | 13 |
| Private hospital | 25 |
| HBT | 6 |
| ICU / trauma | 13 |
| Water total | 178 |
| Water actual | 40 |
| Water approximate | 138 |
| Toilet points | 10 |
| Hirkani points | 39 |
| Halt total | 49 |
| Mukkam | 15 |
| Visava | 34 |

### Sant Tukaram Maharaj Palkhi

| Filter | Count |
|---|---:|
| All non-water points | 206 |
| Ambulance pins | 48 |
| Ambulance vehicles | 46 |
| ALS ambulance vehicles | 11 |
| BLS ambulance vehicles | 22 |
| 102 ambulance vehicles | 13 |
| 108 ambulance vehicles | 0 |
| Doctor / health points | 97 |
| PHC | 20 |
| Rural / subdistrict hospital | 13 |
| Private hospital | 61 |
| HBT | 3 |
| ICU / trauma | 7 |
| Water total | 15 |
| Water actual | 15 |
| Water approximate | 0 |
| Toilet points | 13 |
| Hirkani points | 30 |
| Halt total | 59 |
| Mukkam | 14 |
| Visava | 45 |

## Zero Result Filters

These filters are technically working but show no results with current data:

- Tukaram + 108 ambulance: 0.
- Tukaram + approximate water: 0.

Fix applied: these subfilter chips are now disabled when Tukaram palkhi is selected, while the underlying data remains unchanged.

## Filter Wiring Status

Passed:

- `app.html` inline button handlers all resolve in `assets/js/app.js`.
- `map.html` inline button handlers all resolve in `assets/js/map.js`.
- App and map category filters use matching category names: `all`, `ambulance`, `doc`, `water`, `toilet`, `hirkani`, `halt`.
- Subfilter keys match between HTML and JS: `als`, `bls`, `102`, `108`, `phc`, `rh`, `pvt`, `hbt`, `icu`, `actual`, `approx`, `mukkam`, `visava`.
- Officials and dignitaries scripts render successfully when a DOM is available.

Fixed:

- Desktop shell mirror from `map.html` back to the phone iframe now handles `ambulance`, `doc`, `water`, `toilet`, `hirkani`, and `halt`.
- The phone iframe no longer resets back to "all" immediately after a desktop map filter sync.
- The phone "near" shortcut maps to desktop `all` instead of an unsupported `near` type.
- Desktop map search now applies inside the active filter instead of replacing the active filter.

## Legacy / Preview Pages

These are not part of the production entry path, but they are present in the repo:

- `preview-app.html`
- `preview-map.html`
- `wari_help_map_public_mobile.html`

Notes:

- `preview-app.html` and `preview-map.html` do not load newer data scripts such as `wari-routes-full.js`, `wari-points-amb-supplement.js`, `wari-points-phc102.js`, `wari-points-visava.js`, `wari-points-mymaps.js`, `wari-ambulance-contacts-2026.js`, and `wari-mukkams.js`.
- `wari_help_map_public_mobile.html` is an older standalone page and should be treated as archived/legacy unless intentionally maintained.

Recommendation: either update preview pages to load the same script set as production, or move them into an archive folder so they are not confused with current verified pages.

## Data Merge Status

- `wari-ambulance-contacts-2026.js` loads successfully.
- MEMS roster rows available: 47.
- Roster vehicles matched to current plotted app vehicle numbers: 33.
- Roster vehicles not currently plotted by exact vehicle number: 14.
- Ambulance pins with a contact/doctor/pilot after merge: 108.

Route data:

- Official My Maps Dnyaneshwar Pune route points: 2168.
- Dnyaneshwar extension points: 43.
- Tukaram route points: 104.

## Recommended Next Fixes

1. Archive or refresh the legacy preview pages.
2. Keep monitoring the 14 MEMS roster vehicles not plotted by exact vehicle number; some appear to be vehicle-number conflicts between sources.
