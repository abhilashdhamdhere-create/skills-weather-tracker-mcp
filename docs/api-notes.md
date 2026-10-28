# Open-Meteo API notes

## Pune geocoding

Request:

```text
https://geocoding-api.open-meteo.com/v1/search?name=Pune&count=1
```

The real response returned Pune, India, at latitude `18.51957` and longitude
`73.85535` (Maharashtra). The location fields used for the sample database row
are `results[0].name`, `country`, `latitude`, and `longitude`.

Trimmed response:

```json
{
  "results": [
    {
      "name": "Pune",
      "latitude": 18.51957,
      "longitude": 73.85535,
      "country": "India",
      "admin1": "Maharashtra"
    }
  ]
}
```

## Current weather

Request using the geocoding coordinates:

```text
https://api.open-meteo.com/v1/forecast?latitude=18.51957&longitude=73.85535&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code
```

The requested JSON fields map to `current.temperature_2m` (°C),
`current.relative_humidity_2m` (%), `current.wind_speed_10m` (km/h with the
default Open-Meteo units), and `current.weather_code` (WMO code). The response
provides a code, not a condition description; `condition` needs a WMO-code
mapping.

The Fetch MCP server refused this request because its robots.txt disallows
fetching `api.open-meteo.com`. Consequently, no actual weather response was
available, and weather fields in the seeded Pune row are NULL. This is the
requested response shape, not captured API data:

```json
{
  "current": {
    "temperature_2m": null,
    "relative_humidity_2m": null,
    "wind_speed_10m": null,
    "weather_code": null
  }
}
```
