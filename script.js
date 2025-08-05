const CLIENT_ID = 'Ov23liigKybkVHzWD8WC';
const REPO = 'ylrcyiOrg/ylrcyiOrg.github.io';
let accessToken = '';
let username = '';
let userData = {
  bookmarks: [],
  displayTypes: {}
};

function toggleMenu() {
  document.getElementById("menu").style.display = "block";
}
function closeMenu() {
  document.getElementById("menu").style.display = "none";
}

function githubLogin() {
  const redirectUri = `${location.origin}/comic-manager/oauth.html`;
  const url = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&scope=repo&redirect_uri=${redirectUri}`;
  window.location.href = url;
}

async function loadSeries() {
  const displayType = document.getElementById("displayType").value;
  const series = await fetchLezhinSeries();
  const seriesList = document.getElementById("seriesList");
  seriesList.innerHTML = '<h2 class="container-label">Series List</h2>';

  series.forEach(s => {
    const isBookmarked = userData.bookmarks.includes(s.alias);
    if (displayType === "Bookmarked" && !isBookmarked) return;

    const el = document.createElement("div");
    el.className = "series";
    el.innerHTML = `
      <button onclick="toggleBookmark('${s.alias}')">
        <img src="icons/${isBookmarked ? 'filled_star' : 'empty_star'}.svg" width="20"/>
      </button>
      <button onclick="addToDisplay('${s.alias}')">
        <img src="icons/plus.svg" width="20"/>
      </button>
      <span onclick="loadEpisodes('${s.alias}')">${s.title}</span>
    `;
    seriesList.appendChild(el);
  });
}

function toggleBookmark(alias) {
  const index = userData.bookmarks.indexOf(alias);
  if (index > -1) {
    userData.bookmarks.splice(index, 1);
  } else {
    userData.bookmarks.push(alias);
  }
  saveUserData();
  loadSeries();
}

function addToDisplay(alias) {
  const type = prompt("Add to which display type?");
  if (!userData.displayTypes[type]) userData.displayTypes[type] = [];
  if (!userData.displayTypes[type].includes(alias)) userData.displayTypes[type].push(alias);
  saveUserData();
}

function createDisplayType() {
  const type = prompt("Enter new display type:");
  if (type && !userData.displayTypes[type]) {
    const sel = document.getElementById("displayType");
    const opt = new Option(type, type);
    sel.add(opt);
    userData.displayTypes[type] = [];
    saveUserData();
  }
}

async function fetchLezhinSeries() {
  const dummy = await fetch('https://raw.githubusercontent.com/ylrcyiorg/data/main/lezhin_series.json');
  const res = await dummy.json();
  return res.slice(0, 20); // Dummy example
}

async function loadEpisodes(alias) {
  const episodeList = document.getElementById("episodeList");
  episodeList.innerHTML = '<h2 class="container-label">Episode List</h2>';
  const dummy = Array.from({ length: 5 }, (_, i) => `Episode ${i + 1}`);
  dummy.forEach(ep => {
    const el = document.createElement("div");
    el.className = "episode";
    el.textContent = ep;
    episodeList.appendChild(el);
  });
}

async function fetchUserData() {
  const res = await fetch(`https://api.github.com/repos/${REPO}/contents/users/${username}.json`, {
    headers: { Authorization: `token ${accessToken}` }
  });
  if (res.ok) {
    const data = await res.json();
    const content = JSON.parse(atob(data.content));
    userData = content;
  }
}

async function saveUserData() {
  const path = `users/${username}.json`;
  const fileRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
    headers: { Authorization: `token ${accessToken}` }
  });
  const sha = fileRes.ok ? (await fileRes.json()).sha : undefined;

  await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
    method: 'PUT',
    headers: {
      Authorization: `token ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: "Update user data",
      content: btoa(JSON.stringify(userData)),
      sha
    })
  });
}
