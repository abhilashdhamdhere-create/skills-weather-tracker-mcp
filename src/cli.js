import { getCityStats, insertWeatherLog, listWeatherLogs } from "./db.js";
import { fetchCurrentWeather } from "./weather.js";

// Prints usage information for the supported CLI commands.
function printUsage() {
  console.log(`Usage:
  node src/cli.js add "<city>"
  node src/cli.js list [--limit N]
  node src/cli.js stats "<city>"`);
}

// Formats values for readable fixed-width table output.
function printTable(headers, rows) {
  if (rows.length === 0) {
    console.log("No weather logs found.");
    return;
  }
  const values = rows.map((row) => row.map((value) => String(value ?? "—")));
  const widths = headers.map((header, index) =>
    Math.max(header.length, ...values.map((row) => row[index].length)),
  );
  const formatRow = (row) => row.map((value, index) => value.padEnd(widths[index])).join("  ");
  console.log(formatRow(headers));
  console.log(widths.map((width) => "-".repeat(width)).join("  "));
  values.forEach((row) => console.log(formatRow(row)));
}

// Adds a current observation for a city.
async function addCity(city) {
  const weather = await fetchCurrentWeather(city);
  const id = insertWeatherLog(weather);
  console.log(
    `Saved ${weather.city}, ${weather.country}: ${weather.temperature_c}°C, ` +
      `${weather.condition} (log #${id}).`,
  );
}

// Displays recent weather logs with an optional positive integer limit.
function listLogs(args) {
  let limit = 10;
  if (args.length > 0) {
    if (args.length !== 2 || args[0] !== "--limit" || !/^[1-9]\d*$/.test(args[1])) {
      throw new Error('Use "list [--limit N]" where N is a positive integer.');
    }
    limit = Number(args[1]);
    if (!Number.isSafeInteger(limit)) {
      throw new Error("The list limit is too large.");
    }
  }
  const logs = listWeatherLogs(limit);
  printTable(
    ["City", "Country", "Temp °C", "Humidity %", "Wind km/h", "Condition", "Created at"],
    logs.map((log) => [
      log.city,
      log.country ?? "—",
      log.temperature_c === null ? "—" : log.temperature_c.toFixed(1),
      log.humidity ?? "—",
      log.wind_kmh === null ? "—" : log.wind_kmh.toFixed(1),
      log.condition ?? "—",
      log.created_at,
    ]),
  );
}

// Displays temperature statistics for a city.
function showStats(city) {
  const stats = getCityStats(city);
  if (stats.log_count === 0) {
    console.log(`No weather logs found for "${city}".`);
    return;
  }
  console.log(`Weather statistics for ${city}:`);
  console.log(`  Logs: ${stats.log_count}`);
  console.log(`  Minimum: ${stats.min_temperature ?? "—"}°C`);
  console.log(`  Maximum: ${stats.max_temperature ?? "—"}°C`);
  console.log(
    `  Average: ${stats.average_temperature === null ? "—" : stats.average_temperature.toFixed(1)}°C`,
  );
}

// Routes command-line arguments and converts failures to friendly messages.
async function main(args) {
  const [command, ...commandArgs] = args;
  if (command === "add" && commandArgs.length === 1 && commandArgs[0].trim()) {
    await addCity(commandArgs[0].trim());
    return;
  }
  if (command === "list") {
    listLogs(commandArgs);
    return;
  }
  if (command === "stats" && commandArgs.length === 1 && commandArgs[0].trim()) {
    showStats(commandArgs[0].trim());
    return;
  }
  printUsage();
  process.exitCode = 1;
}

try {
  await main(process.argv.slice(2));
} catch (error) {
  console.error(error instanceof Error ? error.message : "Something went wrong. Please try again.");
  process.exitCode = 1;
}
