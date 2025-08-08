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
  const response = await fetch('http://localhost:8080/https://www.lezhinus.com/lz-api/v2/comics?limit=10000&offset=0', {
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
// Add this to script.js

// Global variables for download state
let currentDownloadingEpisode = null;
let downloadProgress = 0;

// Modified loadEpisodes function with download buttons
async function loadEpisodes(alias) {
  const episodes = await getEpisodeList(alias);
  let episodeListHtml = '';
  
  episodes.forEach((ep, index) => {
    episodeListHtml += `
      <div class="episode">
        <button class="bookmark-btn">
          <img src="assets/icon.svg" alt="Bookmark" class="bookmark-icon" />
        </button>
        <span class="episode-title">${ep.display.title}</span>
        <button class="download-btn" onclick="downloadEpisode('${alias}', ${index}, '${ep.display.title}')">
          <img src="assets/download.svg" alt="Download" class="download-icon" />
        </button>
        <div class="progress-bar" id="progress-${alias}-${index}" style="display: none;">
          <div class="progress-fill"></div>
          <span class="progress-text">0%</span>
        </div>
      </div>`;
  });
  
  const episodeListContainer = document.getElementById('episodeList');
  const existingLabel = episodeListContainer.querySelector('.container-label');
  
  episodeListContainer.innerHTML = ''; // Clear existing content
  episodeListContainer.appendChild(existingLabel); // Append h2 again
  episodeListContainer.innerHTML += episodeListHtml;
}

// Seed reader function from Python
function seedReader(e) {
  e = e ^ (e >> 12);
  e = e ^ ((e << 25) & 18446744073709551615);
  e = e ^ (e >> 27);

  const state = e & 18446744073709551615;
  const place = (e >> 32) % 25;

  return { place, state };
}

// Decode ID function from Python
function decodeId(id) {
  const arrays = Array.from({ length: 25 }, (_, i) => i);
  let gstate = id;
  
  for (let i = 0; i < 25; i++) {
    const { place, state } = seedReader(gstate);
    [arrays[i], arrays[place]] = [arrays[place], arrays[i]];
    gstate = state;
  }
  
  return arrays;
}

// Function to download a single page
async function downloadPage(comicId, episodeId, pageNumber, fixTileMixing, displayTitle) {
  const params = new URLSearchParams({
    purchased: "false",
    q: "40",
    updated: Math.floor(Date.now() / 1000)
  });

  const url = `http://localhost:8080/https://imgserving.lezhin.com/v2/comics/${comicId}/episodes/${episodeId}/contents/scrolls/${pageNumber}.webp?${params}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const blob = await response.blob();
    const img = await createImageBitmap(blob);
    const imgWidth = img.width;
    const imgHeight = img.height;

    if (fixTileMixing) {
      const tileWidth = imgWidth / 5;
      const tileHeight = imgHeight / 5;

      const images = [];
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
          const left = col * tileWidth;
          const top = row * tileHeight;
          const right = left + tileWidth;
          const bottom = top + tileHeight;

          const canvas = new OffscreenCanvas(tileWidth, tileHeight);
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, left, top, tileWidth, tileHeight, 0, 0, tileWidth, tileHeight);
          images.push(canvas);
        }
      }

      // Decode the ID to shuffle the tile order
      const matrix = decodeId(episodeId);
      console.log("Matrix for tile arrangement:", matrix); // Debugging the matrix
      const mergeCanvas = new OffscreenCanvas(imgWidth, imgHeight);
      const mergeCtx = mergeCanvas.getContext('2d');

      // Reassemble the image based on decoded ID (shuffle logic)
      for (let i = 0; i < matrix.length; i++) {
        const matrixVal = matrix[i];
        const left = (i % 5) * tileWidth;
        const top = Math.floor(i / 5) * tileHeight;
        mergeCtx.drawImage(images[matrixVal], left, top);
      }

      // Handle the last part of the image (if the height is not divisible by 5)
      if (imgHeight % 5 !== 0) {
        const bottomTileHeight = imgHeight - (5 * tileHeight);
        const bottomCanvas = new OffscreenCanvas(imgWidth, bottomTileHeight);
        const bottomCtx = bottomCanvas.getContext('2d');
        bottomCtx.drawImage(img, 0, 5 * tileHeight, imgWidth, bottomTileHeight, 0, 0, imgWidth, bottomTileHeight);
        mergeCtx.drawImage(bottomCanvas, 0, 5 * tileHeight);
      }

      return await mergeCanvas.convertToBlob({ type: 'image/jpeg', quality: 0.9 });
    } else {
      // No tile mixing needed
      const canvas = new OffscreenCanvas(imgWidth, imgHeight);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      return await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.9 });
    }
  } catch (error) {
    console.error(`Error downloading page ${pageNumber}:`, error);
    throw error;
  }
}

// Function to create a zip file from blobs
async function createZipFile(blobs, comicId, chapterNumber, displayTitle) {
  const zip = new JSZip();
  const folder = zip.folder(chapterNumber);
  
  blobs.forEach((blob, index) => {
    folder.file(`${index + 1}.jpg`, blob);
  });
  
  const displaySegment = displayTitle ? `;display=${displayTitle}` : '';
  const zipFilename = `[@info[comic=${comicId};chapter=${chapterNumber + 1}${displaySegment}]].zip`;
  
  const content = await zip.generateAsync({ type: 'blob' }, (metadata) => {
    const progress = Math.round(metadata.percent);
    updateDownloadProgress(currentDownloadingEpisode.alias, currentDownloadingEpisode.index, progress);
  });
  
  // Save the zip file
  const link = document.createElement('a');
  link.href = URL.createObjectURL(content);
  link.download = zipFilename;
  link.click();
}

// Function to update download progress
function updateDownloadProgress(alias, index, progress) {
  const progressBar = document.getElementById(`progress-${alias}-${index}`);
  if (progressBar) {
    progressBar.style.display = 'flex';
    const progressFill = progressBar.querySelector('.progress-fill');
    const progressText = progressBar.querySelector('.progress-text');
    
    progressFill.style.width = `${progress}%`;
    progressText.textContent = `${progress}%`;
    
    if (progress === 100) {
      setTimeout(() => {
        progressBar.style.display = 'none';
      }, 2000);
    }
  }
}

// Main function to download an episode
async function downloadEpisode(alias, index, displayTitle) {
  try {
    currentDownloadingEpisode = { alias, index };
    
    // Get episode list from api.lezhin.com
    const episodes = await getEpisodeList(alias);
    if (index >= episodes.length) {
      throw new Error(`Index ${index} out of range for episode list`);
    }
    
    const episode = episodes[index];
    const episodeId = episode.id;
    
    // Get episode info from www.lezhinus.com (still needed for comicId and other metadata)
    const episodeInfo = await getEpisodeInfo(alias, episode.name);
    const fixTileMixing = episodeInfo.tileMixing;
    const comicId = episodeInfo.comicId;
    const pagesNo = episodeInfo.pagesNo;
    
    // Download all pages
    const pageBlobs = [];
    for (let i = 1; i <= pagesNo; i++) {
      try {
        updateDownloadProgress(alias, index, Math.round((i / pagesNo) * 100));
        const blob = await downloadPage(comicId, episodeId, i, fixTileMixing, displayTitle);
        pageBlobs.push(blob);
      } catch (error) {
        console.error(`Error downloading page ${i}:`, error);
        // Continue with next page even if one fails
      }
    }
    
    // Create zip file
    await createZipFile(pageBlobs, comicId, index, displayTitle);
    
    // Reset downloading state
    currentDownloadingEpisode = null;
    updateDownloadProgress(alias, index, 100);
    
  } catch (error) {
    console.error('Error downloading episode:', error);
    if (currentDownloadingEpisode) {
      updateDownloadProgress(currentDownloadingEpisode.alias, currentDownloadingEpisode.index, 0);
    }
    currentDownloadingEpisode = null;
    alert(`Download failed: ${error.message}`);
  }
}
// Function to get episode info (comicId, episodeId, etc.)
async function getEpisodeInfo(alias, episodeName) {
  const token = await getLezhinToken();
  const params = new URLSearchParams({
    platform: "web",
    store: "web",
    alias: alias,
    name: episodeName,
    preload: "false",
    type: "comic_episode"
  });

  const url = `http://localhost:8080/https://www.lezhinus.com/lz-api/v2/inventory_groups/comic_viewer_k?${params}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Cookie': `_LZ_AT=${token}`
    }
  });
  
  const data = await response.json();
  
  return {
    comicId: data.data.extra.episode.idComic,
    episodeId: data.data.extra.episode.id,
    pagesNo: data.data.extra.episode.scroll,
    tileMixing: data.data.extra.comic?.metadata?.imageShuffle || false
  };
}

// Get Lezhin token
async function getLezhinToken() {
  if (!email || !password) return null;
  const response = await fetch('http://localhost:8080/https://www.lezhinus.com/api/authentication/login', {
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

  const url = `http://localhost:8080/https://api.lezhin.com/v2/contents/${alias}/all?type=comic&withExpired=false`;
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
