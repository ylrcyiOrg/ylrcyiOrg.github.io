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

let bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || {};
let displayTypes = JSON.parse(localStorage.getItem('displayTypes')) || {};
let seriesBatoIds = JSON.parse(localStorage.getItem('seriesBatoIds')) || {};

async function loadSeries() {
  const platform = document.getElementById('platform').value;
  const displayType = document.getElementById('displayType').value;

  if (platform === 'Lezhin') {
    await fetchLezhinSeries(displayType);
  }
}

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
      const isBookmarked = bookmarks[series.alias] || false;
      const bookmarkIcon = isBookmarked ? 'assets/filled_star.svg' : 'assets/empty_star.svg';
      const displayTypeSelected = displayType === 'Bookmarked' && isBookmarked;

      if (displayType === 'Bookmarked' && !isBookmarked) return;

      seriesListHtml += `
        <div class="series" onclick="loadEpisodes('${series.alias}')">
          <button class="bookmark-btn" onclick="toggleBookmark('${series.alias}')">
            <img src="${bookmarkIcon}" alt="Bookmark" class="bookmark-icon" />
          </button>
          <button class="add-to-btn" onclick="showMenu(event, '${series.alias}')">
            <img src="assets/plus.svg" alt="Add to" class="add-to-icon" />
          </button>
          ${series.title}
          <div class="menu-options" id="menu-${series.alias}">
            <button class="add-to-display" onclick="addToDisplayType('${series.alias}')">Add to Display Type</button>
            <button class="remove-from-display" onclick="removeFromDisplayType('${series.alias}')">Remove from Display Type</button>
            <button class="set-bato-id" onclick="setBatoId('${series.alias}')">Set Bato Series ID</button>
          </div>
        </div>`;
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

function showMenu(event, alias) {
  event.stopPropagation(); 
  const menu = document.getElementById(`menu-${alias}`);
  menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
}

function addToDisplayType(alias) {
  const displayType = prompt('Enter display type name:');
  if (!displayType) return;

  if (!displayTypes[displayType]) {
    displayTypes[displayType] = [];
  }

  if (!displayTypes[displayType].includes(alias)) {
    displayTypes[displayType].push(alias);
  } else {
    alert('Series already added to this display type.');
  }

  localStorage.setItem('displayTypes', JSON.stringify(displayTypes));
  loadSeries();
}

function removeFromDisplayType(alias) {
  const displayType = prompt('Enter display type name to remove from:');
  if (!displayType || !displayTypes[displayType]) return;

  const index = displayTypes[displayType].indexOf(alias);
  if (index > -1) {
    displayTypes[displayType].splice(index, 1);
    localStorage.setItem('displayTypes', JSON.stringify(displayTypes));
    loadSeries();
  } else {
    alert('Series not found in this display type.');
  }
}

function setBatoId(alias) {
  const batoId = prompt('Enter the Bato series ID:');
  if (batoId) {
    seriesBatoIds[alias] = batoId;
    localStorage.setItem('seriesBatoIds', JSON.stringify(seriesBatoIds));
    alert(`Bato ID for ${alias} set to ${batoId}`);
  }
}

async function loadEpisodes(alias) {
  const episodes = await getEpisodeList(alias);
  let episodeListHtml = '';
  episodes.forEach(ep => {
    episodeListHtml += `<div class="episode">${ep.display.title}</div>`;
  });
  const episodeListContainer = document.getElementById('episodeList');
  const existingLabel = episodeListContainer.querySelector('.container-label');

  episodeListContainer.innerHTML = '';
  episodeListContainer.appendChild(existingLabel);
  episodeListContainer.innerHTML += episodeListHtml;
}

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

function saveCredentials() {
  email = document.getElementById('email').value;
  password = document.getElementById('password').value;
  localStorage.setItem('email', email);
  localStorage.setItem('password', password);
  alert('Credentials saved!');
}

function toggleMenu() {
  const menu = document.getElementById('menu');
  menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
}

function closeMenu() {
  const menu = document.getElementById('menu');
  menu.style.display = 'none';
}
