import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getWeatherSummary, insertWeatherLog, listWeatherLogs } from "./db.js";
import { fetchCurrentWeather } from "./weather.js";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dashboardPath = path.join(projectRoot, "public", "index.html");
const port = Number(process.env.PORT ?? 3000);

// Sends a JSON response with a consistent content type.
function sendJson(response, status, value) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(value));
}

// Serves the dashboard HTML from the public directory.
async function serveDashboard(response) {
  try {
    const html = await readFile(dashboardPath);
    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    response.end(html);
  } catch {
    sendJson(response, 500, { error: "Dashboard file could not be loaded." });
  }
}

// Handles dashboard and JSON API requests.
async function handleRequest(request, response) {
  let url;
  try {
    url = new URL(request.url, `http://${request.headers.host ?? "localhost"}`);
  } catch {
    sendJson(response, 400, { error: "Invalid request URL." });
    return;
  }

  if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
    await serveDashboard(response);
    return;
  }
  if (request.method === "GET" && url.pathname === "/api/logs") {
    sendJson(response, 200, { logs: listWeatherLogs(50) });
    return;
  }
  if (request.method === "GET" && url.pathname === "/api/summary") {
    sendJson(response, 200, { summary: getWeatherSummary() });
    return;
  }
  if (request.method === "POST" && url.pathname === "/api/refresh") {
    const city = url.searchParams.get("city")?.trim();
    if (!city) {
      sendJson(response, 400, { error: "Provide a city with ?city=NAME." });
      return;
    }

    try {
      const weather = await fetchCurrentWeather(city);
      const id = insertWeatherLog(weather);
      sendJson(response, 201, { message: `Saved weather for ${weather.city}.`, id, weather });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not refresh weather.";
      const status = message.startsWith("Could not find ") ? 404 : 502;
      sendJson(response, status, { error: message });
    }
    return;
  }

  sendJson(response, 404, { error: "Not found." });
}

const server = createServer((request, response) => {
  void handleRequest(request, response).catch(() => {
    if (!response.headersSent) {
      sendJson(response, 500, { error: "The server could not complete the request." });
    } else {
      response.destroy();
    }
  });
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Weather dashboard listening on http://localhost:${port}`);
});
