// Wait for the DOM to fully load before adding event listeners
document.addEventListener('DOMContentLoaded', () => {

  // Add event listeners to dropdowns
  document.getElementById('platform').addEventListener('change', loadSeries);
  document.getElementById('displayType').addEventListener('change', loadSeries);

  // Add event listener to load button
  document.querySelector('.load').addEventListener('click', loadSeries);

  // Add event listener to settings button
  document.querySelector('.settings-icon').addEventListener('click', toggleMenu);

  // Add event listener to the close button in the menu
  document.querySelector('.close-btn').addEventListener('click', closeMenu);
  
});

let email = localStorage.getItem('email') || '';
let password = localStorage.getItem('password') || '';

document.getElementById('email').value = email;
document.getElementById('password').value = password;

// Function to load series based on platform and display type
async function loadSeries() {
  const platform = document.getElementById('platform').value;
  const displayType = document.getElementById('displayType').value;
  if (platform === 'Lezhin') {
    await fetchLezhinSeries(displayType);
  }
}

// Function to fetch series from Lezhin platform
async function fetchLezhinSeries(displayType) {
  const token = await getLezhinToken();
  const response = await fetch('https://cors-anywhere.herokuapp.com/https://www.lezhinus.com/lz-api/v2/comics?limit=10000&offset=0', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'sec-ch-ua-platform': '"Chrome OS"',
      'Referer': 'https://www.lezhinus.com/en/comic/thread_never_burned',
      'X-LZ-AllowAdult': 'true',
      'sec-ch-ua': '"Google Chrome";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
      'sec-ch-ua-mobile': '?0',
      'X-LZ-Adult': '2',
      'User-Agent': 'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
      'X-LZ-Genres': 'adult,bl,drama,fantasy,romance',
      'X-LZ-Locale': 'en-US',
      'X-LZ-Country': 'us'
    }
  });
  const data = await response.json();
  
  let seriesListHtml = '';
  if (data.code === 0 && data.data) {
    data.data.forEach(series => {
      seriesListHtml += `<div class="series" onclick="loadEpisodes('${series.alias}')">${series.title}</div>`;
    });
  } else {
    seriesListHtml = '<p>No series found.</p>';
  }

  const seriesListContainer = document.getElementById('seriesList');
  const existingLabel = seriesListContainer.querySelector('.container-label');
  
  seriesListContainer.innerHTML = ''; // Clear existing content
  seriesListContainer.appendChild(existingLabel); // Append h2 again
  seriesListContainer.innerHTML += seriesListHtml;
}

// Function to load episodes for a selected series
async function loadEpisodes(alias) {
  const episodes = await getEpisodeList(alias);
  let episodeListHtml = '';
  episodes.forEach(ep => {
    episodeListHtml += `<div class="episode">${ep.display.title}</div>`;
  });
  const episodeListContainer = document.getElementById('episodeList');
  const existingLabel = episodeListContainer.querySelector('.container-label');
  
  episodeListContainer.innerHTML = ''; // Clear existing content
  episodeListContainer.appendChild(existingLabel); // Append h2 again
  episodeListContainer.innerHTML += episodeListHtml;
}

// Get Lezhin token
async function getLezhinToken() {
  if (!email || !password) return null;
  const response = await fetch('https://cors-anywhere.herokuapp.com/https://www.lezhinus.com/api/authentication/login', {
    method: 'POST',
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0', 'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://www.lezhinus.com/en/login?redirect=%2Fen', 'Content-Type': 'application/json',
        'X-LZ-Locale': 'en-US', 'X-LZ-Country': 'ge', 'X-LZ-Adult': '0',
        'Origin': 'https://www.lezhinus.com', 'Connection': 'keep-alive',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin', 'Priority': 'u=0',
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache',
    },
    body: JSON.stringify({
      email: email,
      password: password,
      remember: true,
      language: 'en',
      provider: 'email'
    })
  });
  const data = await response.json();
  return data.appConfig.accessToken;
}

// Get episode list for a given series alias
async function getEpisodeList(alias) {
  const LEZHIN_HEADERS = {
    'user-agent': 'LezhinComics/2024.8.0 (Linux; Android 9; SM-G998B) gzip',
    'x-lz-platform': 'KG',
    'x-lz-version': '2024.8.0',
    'x-lz-locale': 'en-US',
    'x-lz-adult': '0',
    'x-lz-allowadult': 'false',
    'host': 'api.lezhin.com',
    'connection': 'Keep-Alive',
    'accept-encoding': 'gzip'
  };

  const url = `https://api.lezhin.com/v2/contents/${alias}/all?type=comic&withExpired=false`;
  const response = await fetch(url, { headers: LEZHIN_HEADERS });
  const data = await response.json();

  const episodeListWrong = data.data.episodes;
  const episodeList = episodeListWrong.reverse();
  return episodeList;
}

// Save credentials to localStorage
function saveCredentials() {
  email = document.getElementById('email').value;
  password = document.getElementById('password').value;
  localStorage.setItem('email', email);
  localStorage.setItem('password', password);
  alert('Credentials saved!');
}

// Toggle settings menu visibility
function toggleMenu() {
  const menu = document.getElementById('menu');
  menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
}

// Close the settings menu
function closeMenu() {
  const menu = document.getElementById('menu');
  menu.style.display = 'none';
}
