# Business Centres Access to Railway Lines

A lightweight, client-side map dashboard showing business centres and railway lines in Zimbabwe on an OpenStreetMap-based basemap.

## What was fixed

The deployed version on Render loaded `data/local-layers.js` for `window.LOCAL_MAP_DATA`, but that file was never committed to the repo. `app.js` then threw immediately on `D.businessCentres`, which halted the rest of the script — so the status text stayed stuck on "Loading local data…" and no layers or toggles worked, even though the tile layer itself was fine.

This version:
- Ships `data/local-layers.js` built from the real supplied shapefiles (2,489 business centres, 59 rail lines, converted from `.shp`/`.dbf` to GeoJSON).
- Wraps each layer's setup in `try/catch` so one bad dataset can't blank the whole map again.
- Uses CARTO's OSM-based tiles as the default basemap (more reliable on hosted deployments than hotlinking `tile.openstreetmap.org`), with a one-click switch to standard OpenStreetMap "Streets" tiles and an automatic fallback if a tile layer fails.
- Clusters the 2,489 business centre markers (via Leaflet.markercluster) so the map stays responsive and readable at country zoom.
- Computes the "data coverage extent" rectangle and the map's initial view from the actual loaded data bounds, instead of a hardcoded guess.
- Shows real popups (business centre ID/coordinates; rail line ID and length in km) and live stats (counts, total rail length).

## Run it

Open `index.html` in a browser, or serve the folder with any static file server:

```
npx serve .
```

## Data and limitations

- Business centres and rail network: all features from the supplied Zimbabwe shapefiles (WGS84), converted to a local JavaScript data file so the layers work even when opening `index.html` directly, with no backend needed.
- Business centre records only carry an `id` in the source data — no name/type attribute was present in the shapefile, so popups show ID and coordinates rather than a place name.
- The "data coverage extent" box is derived from the real bounding box of the loaded features, not an official province or country boundary. If you have an actual Zimbabwe province boundary GeoJSON/shapefile, share it and it can be swapped in as a proper polygon layer.
- Basemap: CARTO Positron tiles (built on OpenStreetMap data) by default, with a toggle to standard OpenStreetMap tiles.
- This is a visual/coverage screening tool, not a route, condition, or travel-time model.
