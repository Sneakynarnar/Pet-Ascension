

const happinessMeter = document.querySelector('#happiness');
const cleanMeter = document.querySelector('#cleanliness');
const hungerMeter = document.querySelector('#hunger');
const petNameTitle = document.querySelector('#petname');
const petContainer = document.querySelector('#petcontainer');
const linkContainer = document.querySelector('#linkcontainer');
const NPamount = document.querySelector('#NP');
const playButton = document.querySelector('#play');
const cleanButton = document.querySelector('#clean');
const feedButton = document.querySelector('#feed');
const feedDialog = document.querySelector('#feeddialog');
const feedSelectMenu = document.querySelector('#feedselect');
const confirmFeed = document.querySelector('#confirmfeed');
const confirmClean = document.querySelector('#confirmclean');
const cleanDialog = document.querySelector('#cleandialog');
const cleanSelectMenu = document.querySelector('#cleanselect');
const petName = window.location.pathname.slice(25);
const accountId = window.location.pathname.slice(6, 24);
const apiPath = window.location.pathname.slice(6);
let payload;
async function updateMeters() {
  const response = await fetch('http://localhost:8080/api/' + apiPath);
  const petStats = await response.json();
  const petSvg = document.createElement('object');
  // petSvg.type = 'image/svg+xml';
  petStats.type = 'cat';
  petSvg.data = `/petsvgs/${petStats.type}.svg`;
  petSvg.width = 200;
  petSvg.height = 200;
  console.log(petSvg);
  if (petContainer.children.length === 0) {
    petContainer.appendChild(petSvg);
  }
  NPamount.textContent = `NP: ${petStats.NP}`;
  petNameTitle.textContent = petName;
  happinessMeter.value = petStats.happiness;
  hungerMeter.value = petStats.hunger;
  cleanMeter.value = petStats.cleanliness;
}

async function petPlay(e) {
  console.log('playing');
  const response = await fetch('http://localhost:8080/api/' + apiPath + '/play', {
    method: 'POST',
  });
  if (response.ok) {
    await updateMeters();
  } else {
    console.log('pet too tired to play');
  }
}
function petFeed() {
  let newOption;
  let itemData;
  confirmFeed.disabled = true;
  feedSelectMenu.replaceChildren();
  newOption = document.createElement('option');
  newOption.textContent = 'Select food...';
  newOption.value = 'default';
  feedSelectMenu.appendChild(newOption);
  for (const item of Object.keys(payload.owned)) {
    itemData = payload.info[item];
    if (itemData.type === 1) {
      newOption = document.createElement('option');
      newOption.textContent = itemData.name;
      newOption.value = item;
      feedSelectMenu.appendChild(newOption);
    }
  }
  feedDialog.showModal();
}
function petClean() {
  let newOption;
  let itemData;
  confirmClean.disabled = true;
  cleanSelectMenu.replaceChildren();
  newOption = document.createElement('option');
  newOption.textContent = 'Select cleaning item...';
  newOption.value = 'default';
  cleanSelectMenu.appendChild(newOption);
  for (const item of Object.keys(payload.owned)) {
    itemData = payload.info[item];
    if (itemData.type === 0) {
      newOption = document.createElement('option');
      newOption.textContent = itemData.name;
      newOption.value = item;
      cleanSelectMenu.appendChild(newOption);
    }
  }
  cleanDialog.showModal();
}
async function sendCareRequest(confirm) {
  const response = await fetch('http://localhost:8080/api/' + apiPath + (payload.info[confirm.value].type === 0 ? '/clean' : '/feed'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ item: confirm.value }),
  });
  if (response.ok) {
    await updateMeters();
  } else {
    console.log(response.statusText);
  }
}
function handleSelections(confirm, selectMenu) {
  confirm.value = selectMenu.value;
  confirm.disabled = confirm.value === 'default';
}
async function main() {
  await updateMeters();
  playButton.addEventListener('click', petPlay);
  feedButton.addEventListener('click', petFeed);
  cleanButton.addEventListener('click', petClean);
  cleanSelectMenu.addEventListener('change', () => { handleSelections(confirmClean, cleanSelectMenu); });
  feedSelectMenu.addEventListener('change', () => { handleSelections(confirmFeed, feedSelectMenu); });
  feedDialog.addEventListener('close', () => { sendCareRequest(confirmFeed); });
  cleanDialog.addEventListener('close', () => { sendCareRequest(confirmClean); });
  const shopLink = document.createElement('a');
  const itemRes = await fetch('http://localhost:8080/api/' + accountId + '/items', {
    method: 'GET',
  });
  payload = await itemRes.json();
  shopLink.href = 'http://localhost:8080/' + 'shop' + window.location.pathname.slice(5, 24);
  shopLink.textContent = 'Go to the shop!';
  linkContainer.appendChild(shopLink);
}
window.addEventListener('load', main);
