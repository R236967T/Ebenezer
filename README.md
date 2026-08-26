# Business Centres Access to Railway Lines

A lightweight, client-side map dashboard showing business centres and railway lines in Zimbabwe on a standard OpenStreetMap basemap.

## Run it

Open `index.html` in a browser. If browser restrictions prevent remote data requests from a local file, serve the folder with any simple static web server.

## Data and limitations

- Business centres and rail load locally on startup. Schools and roads are optional live OpenStreetMap layers, loaded with the **Load online layers** button, so an online-service outage cannot prevent the dashboard from opening.
- Business centres and rail: all features from the supplied Zimbabwe shapefiles, converted to a local JavaScript data file so the layers work even when opening `index.html` directly.
- Provincial boundary: geoBoundaries gbOpen (CC-BY 4.0).
- Basemap: standard OpenStreetMap tiles; no API key is needed.
- Accessibility is a visual screening measure (nearest straight-line distance to mapped primary, secondary, or tertiary roads), not a route, condition, or travel-time model.
