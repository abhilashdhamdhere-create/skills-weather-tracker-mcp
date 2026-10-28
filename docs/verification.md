# Weather database verification

Checked every row in the `weather_logs` table in `weather.db` with a read-only
SQLite connection.
SQLite MCP tools were not callable in this chat session, so these results were
not obtained through MCP.

## City summary

| City | Rows | Average temperature |
|---|---:|---:|
| London | 2 | 8.25 °C |
| Mumbai | 1 | 34.1 °C |
| Nagpur | 1 | 29.5 °C |
| Pune | 1 | NULL |
| Tokyo | 1 | 16.3 °C |

## CLI and dashboard entries

- The CLI-added London and Tokyo rows are present: London row IDs 2 and 6
  (8.3 °C and 8.2 °C), and Tokyo row ID 3 (16.3 °C).
- Mumbai row ID 4 (34.1 °C) and Nagpur row ID 5 (29.5 °C) are also present.
  The database schema has no source field, so it cannot establish which
  insertion came from the web UI. Row IDs and timestamps alone are not proof
  of the insertion path.

## Anomalies

- One row (Pune, ID 1) has NULL values for `temperature_c`, `humidity`,
  `wind_kmh`, `condition`, and `weather_code`. All other checked fields are
  non-NULL.
- No duplicate `(city, created_at)` pairs were found.
