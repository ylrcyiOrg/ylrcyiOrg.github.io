let email = localStorage.getItem('email') || '';
let password = localStorage.getItem('password') || '';

document.getElementById('email').value = email;
document.getElementById('password').value = password;

async function loadSeries() {
  const platform = document.getElementById('platform').value;
  const displayType = document.getElementById('displayType').value;
  if (platform === 'Lezhin') {
    await fetchLezhinSeries(displayType);
  }
}

async function fetchLezhinSeries(displayType) {
  const token = await getLezhinToken();
  const response = await fetch('https://www.lezhinus.com/lz-api/v2/comics', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  const data = await response.json();
  
  let seriesListHtml = '';
  data.data.forEach(series => {
    seriesListHtml += `<div class="series" onclick="loadEpisodes('${series.alias}')">${series.title}</div>`;
  });

  document.getElementById('seriesList').innerHTML = seriesListHtml;
}

async function loadEpisodes(alias) {
  const episodes = await getEpisodeList(alias);
  let episodeListHtml = '';
  episodes.forEach(ep => {
    episodeListHtml += `<div class="episode">${ep.display.title}</div>`;
  });
  document.getElementById('episodeList').innerHTML = episodeListHtml;
}

async function getLezhinToken() {
  if (!email || !password) return null;
  const response = await fetch('https://www.lezhinus.com/api/authentication/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, remember: true })
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
