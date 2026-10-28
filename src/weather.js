const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

// Maps Open-Meteo WMO weather codes to readable condition labels.
export function describeWeatherCode(code) {
  if (code === 0) return "Clear";
  if (code === 1) return "Mainly clear";
  if (code === 2) return "Partly cloudy";
  if (code === 3) return "Overcast";
  if (code === 45 || code === 48) return "Fog";
  if ([51, 53, 55].includes(code)) return "Drizzle";
  if ([56, 57].includes(code)) return "Freezing drizzle";
  if ([61, 63, 65].includes(code)) return "Rain";
  if ([66, 67].includes(code)) return "Freezing rain";
  if ([71, 73, 75, 77].includes(code)) return "Snow";
  if ([80, 81, 82].includes(code)) return "Rain showers";
  if ([85, 86].includes(code)) return "Snow showers";
  if (code === 95) return "Thunderstorm";
  if ([96, 99].includes(code)) return "Thunderstorm with hail";
  return "Unknown";
}

// Requests JSON from Open-Meteo and reports network, HTTP, or JSON errors clearly.
async function fetchJson(url) {
  let response;
  try {
    response = await fetch(url);
  } catch {
    throw new Error("Could not reach Open-Meteo. Check your internet connection and try again.");
  }
  if (!response.ok) {
    throw new Error(`Open-Meteo returned HTTP ${response.status}. Please try again later.`);
  }
  try {
    return await response.json();
  } catch {
    throw new Error("Open-Meteo returned an invalid response. Please try again later.");
  }
}

// Looks up a city, fetches its current weather, and returns a database-ready record.
export async function fetchCurrentWeather(city) {
  const geocodingUrl = new URL(GEOCODING_URL);
  geocodingUrl.search = new URLSearchParams({ name: city, count: "1" });
  const geocoding = await fetchJson(geocodingUrl);
  const location = geocoding.results?.[0];
  if (!location) {
    throw new Error(`Could not find "${city}". Check the city name and try again.`);
  }

  const forecastUrl = new URL(FORECAST_URL);
  forecastUrl.search = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current: "temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code",
  });
  const forecast = await fetchJson(forecastUrl);
  const current = forecast.current;
  if (
    !current ||
    !Number.isFinite(current.temperature_2m) ||
    !Number.isInteger(current.relative_humidity_2m) ||
    !Number.isFinite(current.wind_speed_10m) ||
    !Number.isInteger(current.weather_code)
  ) {
    throw new Error("Open-Meteo returned incomplete current-weather data. Please try again later.");
  }

  return {
    city: location.name,
    country: location.country ?? null,
    latitude: location.latitude,
    longitude: location.longitude,
    temperature_c: current.temperature_2m,
    humidity: current.relative_humidity_2m,
    wind_kmh: current.wind_speed_10m,
    condition: describeWeatherCode(current.weather_code),
    weather_code: current.weather_code,
  };
}
