// Wait for the DOM to fully load before adding event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Initialize display types dropdown
  updateDisplayTypesDropdown();
  
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
let currentSeriesAlias = null; // Track which series is being managed
let currentDisplayType = null; // Track which display type is being edited

document.getElementById('email').value = email;
document.getElementById('password').value = password;

let bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || {};
let displayTypes = JSON.parse(localStorage.getItem('displayTypes')) || {};
let batoSeriesIds = JSON.parse(localStorage.getItem('batoSeriesIds')) || {};

// Function to update display types dropdown
function updateDisplayTypesDropdown() {
  const displayTypeSelect = document.getElementById('displayType');
  
  // Clear existing options except All and Bookmarked
  displayTypeSelect.innerHTML = `
    <option value="All">All</option>
    <option value="Bookmarked">Bookmarked</option>
  `;
  
  // Add existing display types
  Object.keys(displayTypes).forEach(type => {
    if (type !== 'All' && type !== 'Bookmarked') {
      const option = document.createElement('option');
      option.value = type;
      option.textContent = type;
      displayTypeSelect.appendChild(option);
    }
  });
  
  // Add "Create New Display Group" option
  const newOption = document.createElement('option');
  newOption.value = 'Create New Display Group';
  newOption.textContent = 'Create New Display Group';
  displayTypeSelect.appendChild(newOption);
}

// Function to load series based on display type
async function loadSeries() {
  const platform = document.getElementById('platform').value;
  const displayType = document.getElementById('displayType').value;
  
  // Handle "Create New Display Group" selection
  if (displayType === 'Create New Display Group') {
    document.getElementById('newDisplayPopup').style.display = 'block';
    document.getElementById('displayType').value = 'All'; // Reset to All
    return;
  }
  
  if (platform === 'Lezhin') {
    await fetchLezhinSeries(displayType);
  }
}

// Function to show the "Add to" popup
function addToDisplayType(alias, event) {
  event.stopPropagation(); // Prevent triggering the series click
  currentSeriesAlias = alias;
  
  // Set current Bato ID if exists
  document.getElementById('batoSeriesId').value = batoSeriesIds[alias] || '';
  
  // Populate display types list
  const displayTypesList = document.getElementById('displayTypesList');
  displayTypesList.innerHTML = '';
  
  Object.keys(displayTypes).forEach(type => {
    if (type !== 'All' && type !== 'Bookmarked') {
      const isInType = displayTypes[type].includes(alias);
      const item = document.createElement('div');
      item.className = 'display-type-item';
      item.innerHTML = `
        <input type="checkbox" id="type-${type}" ${isInType ? 'checked' : ''}>
        <label for="type-${type}">${type}</label>
        <button class="edit-display-btn" onclick="editDisplayType('${type}', event)">
          <img src="assets/edit.svg" alt="Edit" width="14" height="14">
        </button>
      `;
      item.querySelector('input').addEventListener('change', (e) => {
        toggleSeriesInDisplayType(alias, type, e.target.checked);
      });
      displayTypesList.appendChild(item);
    }
  });
  
  // Show the popup
  document.getElementById('addToPopup').style.display = 'block';
}

// Function to edit a display type
function editDisplayType(type, event) {
  event.stopPropagation();
  currentDisplayType = type;
  document.getElementById('editDisplayTypeName').value = type;
  document.getElementById('editDisplayPopup').style.display = 'block';
}

// Function to save edited display type
function saveEditedDisplayType() {
  const newName = document.getElementById('editDisplayTypeName').value.trim();
  
  if (newName && newName !== currentDisplayType) {
    // Rename the display type
    if (displayTypes[currentDisplayType]) {
      displayTypes[newName] = displayTypes[currentDisplayType];
      delete displayTypes[currentDisplayType];
      localStorage.setItem('displayTypes', JSON.stringify(displayTypes));
      updateDisplayTypesDropdown();
    }
  }
  
  closeEditDisplayPopup();
}

// Function to delete current display type
function deleteDisplayType() {
  if (confirm(`Are you sure you want to delete the display type "${currentDisplayType}"?`)) {
    delete displayTypes[currentDisplayType];
    localStorage.setItem('displayTypes', JSON.stringify(displayTypes));
    updateDisplayTypesDropdown();
    loadSeries(); // Refresh the series list
    closeEditDisplayPopup();
  }
}

// Function to close edit display popup
function closeEditDisplayPopup() {
  document.getElementById('editDisplayPopup').style.display = 'none';
  currentDisplayType = null;
}

// Function to toggle series in a display type
function toggleSeriesInDisplayType(alias, type, isChecked) {
  if (!displayTypes[type]) {
    displayTypes[type] = [];
  }
  
  if (isChecked && !displayTypes[type].includes(alias)) {
    displayTypes[type].push(alias);
  } else if (!isChecked) {
    const index = displayTypes[type].indexOf(alias);
    if (index > -1) {
      displayTypes[type].splice(index, 1);
    }
  }
  
  localStorage.setItem('displayTypes', JSON.stringify(displayTypes));
  updateDisplayTypesDropdown();
}

// Function to set Bato ID for current series
function setBatoId() {
  const batoId = document.getElementById('batoSeriesId').value.trim();
  if (currentSeriesAlias) {
    batoSeriesIds[currentSeriesAlias] = batoId;
    localStorage.setItem('batoSeriesIds', JSON.stringify(batoSeriesIds));
    
    // Show confirmation
    document.getElementById('batoConfirmPopup').style.display = 'block';
  }
}

// Function to create a new display type
function createNewDisplayType() {
  document.getElementById('newDisplayPopup').style.display = 'block';
}

// Function to confirm new display type creation
function confirmNewDisplayType() {
  const newTypeName = document.getElementById('newDisplayTypeName').value.trim();
  if (newTypeName && !displayTypes[newTypeName]) {
    displayTypes[newTypeName] = [];
    localStorage.setItem('displayTypes', JSON.stringify(displayTypes));
    
    // Add to dropdown
    updateDisplayTypesDropdown();
    
    // Select the new type
    document.getElementById('displayType').value = newTypeName;
    
    // Close popup and reload series
    closeNewDisplayPopup();
    loadSeries();
  }
}

// Function to close "Add to" popup
function closeAddToPopup() {
  document.getElementById('addToPopup').style.display = 'none';
  currentSeriesAlias = null;
}

// Function to close Bato confirmation popup
function closeBatoConfirmPopup() {
  document.getElementById('batoConfirmPopup').style.display = 'none';
}

// Function to close new display type popup
function closeNewDisplayPopup() {
  document.getElementById('newDisplayPopup').style.display = 'none';
  document.getElementById('newDisplayTypeName').value = '';
}

// Function to fetch Lezhin series with display type filtering
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
      
      // Filter based on display type
      if (displayType === 'Bookmarked' && !isBookmarked) return;
      if (displayType !== 'All' && displayType !== 'Bookmarked' && 
          (!displayTypes[displayType] || !displayTypes[displayType].includes(series.alias))) {
        return;
      }
      
      seriesListHtml += `
        <div class="series" onclick="loadEpisodes('${series.alias}')">
          <button class="bookmark-btn" onclick="toggleBookmark('${series.alias}', event)">
            <img src="${bookmarkIcon}" alt="Bookmark" class="bookmark-icon" />
          </button>
          <button class="add-to-btn" onclick="addToDisplayType('${series.alias}', event)">
            <img src="assets/plus.svg" alt="Add to" class="add-to-icon" />
          </button>
          ${series.title}
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

// Function to toggle bookmark status for a series
function toggleBookmark(alias, event) {
  event.stopPropagation();
  bookmarks[alias] = !bookmarks[alias];
  localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
  loadSeries(); // Re-load series after toggle
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
