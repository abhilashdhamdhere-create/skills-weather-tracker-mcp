import Database from "better-sqlite3";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const database = new Database(path.join(projectRoot, "weather.db"));

// Reads recent weather logs, newest first.
export function listWeatherLogs(limit) {
  return database
    .prepare(
      `SELECT city, country, temperature_c, humidity, wind_kmh, condition, created_at
       FROM weather_logs
       ORDER BY created_at DESC, id DESC
       LIMIT ?`,
    )
    .all(limit);
}

// Inserts a weather observation and returns its generated ID.
export function insertWeatherLog(weather) {
  const result = database
    .prepare(
      `INSERT INTO weather_logs
        (city, country, latitude, longitude, temperature_c, humidity, wind_kmh, condition, weather_code)
       VALUES
        (@city, @country, @latitude, @longitude, @temperature_c, @humidity, @wind_kmh, @condition, @weather_code)`,
    )
    .run(weather);
  return Number(result.lastInsertRowid);
}

// Summarizes the recorded temperatures for one city.
export function getCityStats(city) {
  return database
    .prepare(
      `SELECT MIN(temperature_c) AS min_temperature,
              MAX(temperature_c) AS max_temperature,
              AVG(temperature_c) AS average_temperature,
              COUNT(*) AS log_count
       FROM weather_logs
       WHERE city = ? COLLATE NOCASE`,
    )
    .get(city);
}
