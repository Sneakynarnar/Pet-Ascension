// elements
const fitnessMeter = document.querySelector('#fitness');
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
const XPcounter = document.querySelector('#exp');
const sacrifice = document.querySelector('#sacrifice');
const level = document.querySelector('#level');
const levelIndicator = document.querySelector('#score');
// variables
const playCom = [];
const combination = [];
let level = 1;
let playing = false;

const petName = window.location.pathname.slice(25);
const accountId = window.location.pathname.slice(6, 24);
const apiPath = window.location.pathname.slice(6);
let payload;
async function updateMeters() {
  const response = await fetch('http://localhost:8080/api/' + apiPath);
  const petStats = await response.json();
  level.textContent = `level: ${petStats.level}`;
  if (petStats.level > 15) {
    sacrifice.disabled = false;
  }
  XPcounter.textContent = `${petStats.XP}/10000`;
  const petSvg = document.createElement('object');
  // petSvg.type = 'image/svg+xml';
  petSvg.data = `/petsvgs/${petStats.type}.svg`;
  petSvg.width = 200;
  petSvg.height = 200;
  if (petContainer.children.length === 0) {
    petContainer.appendChild(petSvg);
  }

  NPamount.textContent = `NP: ${petStats.NP}`;
  petNameTitle.textContent = petName;

  if (petStats.dead) {
    level.textContent = `level: Doesn't matter ${petStats.petName} is dead`;
    XPcounter.textContent = '';
    cleanButton.disabled = true;
    playButton.disabled = true;
    feedButton.disabled = true;
    sacrifice.disabled = true;
  }
  fitnessMeter.value = Math.round(petStats.fitness);
  hungerMeter.value = Math.round(petStats.hunger);
  cleanMeter.value = Math.round(petStats.cleanliness);
  happinessMeter.value = (petStats.fitness + petStats.hunger + petStats.cleanliness) / 3;
}

async function petPlay() {
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
  console.log(`ownedItems = ${JSON.stringify(payload.owned)}`);
  for (const item of Object.keys(payload.owned)) {
    console.log(`Item: ${item}`);
    itemData = payload.info[item];
    console.log(itemData);
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
  console.log(`ownedItems = ${payload.owned}`);
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

async function sacrificePet() {
  const response = await fetch('http://localhost:8080/pets/' + apiPath + '/sacrifice', {
    method: 'POST',
  });
  if (response.ok) {
    console.log(response);
    await updateMeters();
  }
}
async function sendCareRequest(confirm) {
  if (confirm.value === 'default') { return; }
  const response = await fetch('http://localhost:8080/api/' + apiPath + '/care', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ item: confirm.value }),
  });
  if (response.ok) {
    await updateMeters();
  } else {
    console.log(await response.text());
  }
}
function handleSelections(confirm, selectMenu) {
  confirm.value = selectMenu.value;
  console.log(confirmClean.value);
  confirm.disabled = confirm.value === 'default';
}
function setupMemoryGame() {
  const game = document.querySelector('#game');
  for (let i = 1; i <= 9; i++) {
    const div = document.createElement('div');
    div.id = 'space' + i;
    game.addEventListener('click', clickHandler);
    game.append(div);
  }

}
function memoryGameClickHandler() {
  
  if (!playing) {
    e.target.style = 'background-color: red';
    setTimeout(() => { e.target.style = 'background-color: lime'; }, 100);
    playCom.push(Number(e.target.id[5]));
    for (let i = 0; i < playCom.length; i++) {
      if (combination[i] !== playCom[i]) {
        combination = [];
        playCom = [];
        levelIndicator.textContent = 'Level: 1';
        wrongAnswer();
        break;
      }
    }
    if (playCom.toString() === combination.toString()) {
      rightAnswer();
    }
  }
}
async function main() {
  await updateMeters();
  playButton.addEventListener('click', petPlay);
  feedButton.addEventListener('click', petFeed);
  cleanButton.addEventListener('click', petClean);
  sacrifice.addEventListener('click', sacrificePet);
  cleanSelectMenu.addEventListener('change', () => { handleSelections(confirmClean, cleanSelectMenu); });
  feedSelectMenu.addEventListener('change', () => { handleSelections(confirmFeed, feedSelectMenu); });
  feedDialog.addEventListener('close', () => { sendCareRequest(confirmFeed); });
  cleanDialog.addEventListener('close', () => { sendCareRequest(confirmClean); });
  const shopLink = document.createElement('a');
  const itemRes = await fetch('http://localhost:8080/api/' + accountId + '/items', {
    method: 'GET',
  });
  payload = await itemRes.json();
  payload.owned = JSON.parse(payload.owned);
  shopLink.href = 'http://localhost:8080/' + 'shop' + window.location.pathname.slice(5, 24);
  shopLink.textContent = 'Go to the shop!';
  linkContainer.appendChild(shopLink);
}
window.addEventListener('load', main);
