const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const card = document.getElementById("weatherCard");
const errorEl = document.getElementById("error");
const loader = document.getElementById("loader");
const unitToggle = document.getElementById("unitToggle");
const historyList = document.getElementById("historyList");
const suggestionsBox = document.getElementById("suggestions");

let isCelsius = true;
let history = [];
let lastWeatherData = null;

/* Events */
searchBtn.onclick = () => fetchWeather();
cityInput.addEventListener("keydown", e => e.key === "Enter" && fetchWeather());
unitToggle.onclick = toggleUnit;
cityInput.addEventListener("input", () => fetchCitySuggestions(cityInput.value.trim()));

/* Weather Fetch */
async function fetchWeather(cityName) {
    const city = cityName || cityInput.value.trim();
    if (!city) return showError("Please enter a city name");

    suggestionsBox.classList.add("hidden");
    loader.classList.remove("hidden");
    card.classList.add("hidden");
    errorEl.textContent = "";

    try {
        const geo = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`
        ).then(res => res.json());

        if (!geo.results) throw "City not found";

        const { latitude, longitude, name, country } = geo.results[0];

        const weatherData = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
        ).then(res => res.json());

        lastWeatherData = {
            city: name,
            country,
            weather: weatherData.current_weather
        };

        setBackground(weatherData.current_weather.weathercode);
        displayWeather();
        updateHistory(name);

    } catch (err) {
        showError(err);
    } finally {
        loader.classList.add("hidden");
    }
}

/* Display */
function displayWeather() {
    if (!lastWeatherData) return;

    const { city, country, weather } = lastWeatherData;

    const temp = isCelsius
        ? weather.temperature
        : (weather.temperature * 9 / 5 + 32).toFixed(1);

    const unit = isCelsius ? "°C" : "°F";

    card.innerHTML = `
        <h2>${city}, ${country}</h2>
        <div class="row"><span>🌡 Temperature</span><span>${temp} ${unit}</span></div>
        <div class="row"><span>💨 Wind</span><span>${weather.windspeed} km/h</span></div>
        <div class="row"><span>🧭 Direction</span><span>${weather.winddirection}°</span></div>
    `;

    card.classList.remove("hidden");
}

/* Unit Toggle */
function toggleUnit() {
    isCelsius = !isCelsius;
    unitToggle.textContent = isCelsius ? "°F" : "°C";
    displayWeather();
}

/* Background */
function setBackground(code) {
    document.body.className = "";
    if (code < 3) document.body.classList.add("clear");
    else if (code < 50) document.body.classList.add("cloudy");
    else if (code < 70) document.body.classList.add("rain");
    else document.body.classList.add("snow");
}

/* History */
function updateHistory(city) {
    if (history.includes(city)) return;
    history.unshift(city);
    history = history.slice(0, 5);

    historyList.innerHTML = "";
    history.forEach(c => {
        const li = document.createElement("li");
        li.textContent = c;
        li.onclick = () => fetchWeather(c);
        historyList.appendChild(li);
    });
}

/* Autocomplete */
async function fetchCitySuggestions(query) {
    if (query.length < 2) {
        suggestionsBox.classList.add("hidden");
        return;
    }

    try {
        const res = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=5`
        );
        const data = await res.json();

        if (!data.results) return;

        suggestionsBox.innerHTML = "";
        data.results.forEach(city => {
            const li = document.createElement("li");
            li.textContent = `${city.name}, ${city.country}`;
            li.onclick = () => {
                cityInput.value = city.name;
                suggestionsBox.classList.add("hidden");
                fetchWeather(city.name);
            };
            suggestionsBox.appendChild(li);
        });

        suggestionsBox.classList.remove("hidden");
    } catch {
        suggestionsBox.classList.add("hidden");
    }
}

function showError(msg) {
    errorEl.textContent = msg;
}
