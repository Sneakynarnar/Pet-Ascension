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
const memoryGameDialog = document.querySelector('#memorygamedialog');
const game = document.querySelector('#memorygame');
const level = document.querySelector('#level');
const closeButton = document.querySelector('#memoryclose');
const levelIndicator = document.querySelector('#score');
const memoryGamePetContainer = document.querySelector('#memorygamepetcontainer');
const holGameDialog = document.querySelector('#holgamedialog');
const topCard = document.querySelector('#topcard');
const dupeCard = document.querySelector('#dupecardcontainer');
const dupeCardNumber = document.querySelector('#cardnumberdupe');
const cardNumber = document.querySelector('#cardnumber');
const holScoreEl = document.querySelector('#holscore');
const boost = document.querySelector('#boost');
const higher = document.querySelector('#higher');
const lower = document.querySelector('#lower');
const holclose = document.querySelector('#holclose');
const holBoost = document.querySelector('#holboost');
const deathStats = document.querySelector('#deathstats');
let holScore = 0;
// variables
let playCom = [];
let combination = [];
let gamelevel = 1;
let playing = false;
const MAX_HOL_NUMBER = 9;
const petName = window.location.pathname.slice(25);
const accountId = window.location.pathname.slice(6, 24);
const apiPath = window.location.pathname.slice(6);
let petStats;
let payload;
async function updateMeters() {
  const response = await fetch('http://localhost:8080/api/' + apiPath);
  petStats = await response.json();
  level.textContent = `level: ${petStats.level}`;
  if (petStats.level > 15) {
    sacrifice.disabled = false;
  }
  XPcounter.textContent = `${petStats.XP}/10000`;
  const petSvg = document.createElement('object');

  for (const elem of document.querySelectorAll(`#${petStats.type}pre`)) {
    elem.classList.remove('notpet');
  }
  NPamount.textContent = `NP: ${petStats.NP}`;
  petNameTitle.textContent = petName;
  let colorelements;
  petStats.colors = JSON.parse(petStats.colors);
  console.log(petStats.colors);
  for (const [part, color] of Object.entries(petStats.colors)) {
    console.log(part);
    console.log('.pre' + petStats.type + part);
    colorelements = document.querySelectorAll('.pre' + petStats.type + part);
    for (const elem of colorelements) {
      elem.style = `fill: ${color}; `;
    }
  }
  if (petStats.dead) {
    level.textContent = `level: Doesn't matter ${petStats.petName} is dead`;
    XPcounter.textContent = '';
    cleanButton.disabled = true;
    playButton.disabled = true;
    feedButton.disabled = true;
    sacrifice.disabled = true;
    console.log(`Number: ${petStats.diedAt}`);
    const timeAliveWordified = wordifyTimeInMilliseconds(Number(petStats.diedAt) - Number(petStats.dateCreated));
    deathStats.textContent = `Level reached: ${petStats.level}\n Lived for: ${timeAliveWordified}\nGuild level: ${petStats.rank}\nTimes fed: ${petStats.timesFed}\nTimes cleaned: ${petStats.timesCleaned}\nTimes played: ${petStats.timesPlayed}`;
  }
  fitnessMeter.value = Math.round(petStats.fitness);
  hungerMeter.value = Math.round(petStats.hunger);
  cleanMeter.value = Math.round(petStats.cleanliness);
  happinessMeter.value = (petStats.fitness + petStats.hunger + petStats.cleanliness) / 3;
}

async function petPlay(boost) {
  console.log('playing');
  const response = await fetch('http://localhost:8080/api/' + apiPath + '/play', {
    method: 'POST',
    body: JSON.stringify({ boost: boost - 1 }),
    headers: { 'Content-Type': 'application/json' },
  });
  if (response.ok) {
    await updateMeters();
  } else {
    console.log('pet too tired to play');
  }
}

function wordifyTimeInMilliseconds(time) {
  console.log(time);
  let days = 0;
  let hours = 0;
  let minutes = 0;
  let seconds = 0;
  let milliseconds = 0;
  while (time > 0) {
    if (time > 1000 * 3600 * 24) {
      time -= 1000 * 3600 * 24;
      days += 1;
    } else if (time > 1000 * 3600) {
      time -= 1000 * 3600;
      hours += 1;
    } else if (time > 1000 * 60) {
      time -= 1000 * 60;
      minutes += 1;
    } else if (time > 1000) {
      time -= 1000;
      seconds += 1;
    } else {
      milliseconds = time;
      time = 0;
    }
  }
  return `${days} day(s), ${hours} hour(s), ${minutes} minute(s), ${seconds} second(s),`;
}
function startRandomGame() {
  if (Math.round(Math.random() * 2) === 1) {
    startHigherOrLower();
  } else {
    startMemoryGame();
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
    console.log(item);
    if (item === 'pet_blood') {
      continue;
    }
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
    if (item === 'pet_blood') {
      continue;
    }
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

// memory game
function startMemoryGame() {
  game.addEventListener('click', memoryGameClickHandler);
  boost.textContent = '';
  memoryGameDialog.showModal();
  console.log('starting memory game');
  gamelevel = 1;
  nextLevel(gamelevel);
}
function setupMemoryGame() {
  for (let i = 1; i <= 9; i++) {
    const div = document.createElement('div');
    div.id = 'space' + i;
    div.classList.add('memoryspace');
    game.append(div);
  }
  // memoryGameDialog.remove(closeButton);

  boost.textContent = '';
}
function endGame(space) {
  game.classList.remove('right', 'wrong');
  const spaceElement = document.querySelector('#space' + space);
  game.removeEventListener('click', memoryGameClickHandler);
  const boostAmount = (gamelevel - 1) * 10 > 100 ? 100 : (gamelevel - 1) * 10;
  boost.textContent = `You have earned a ${boostAmount}% happiness boost!`;
  spaceElement.classList.add('wrongfunction');
  memoryGameDialog.appendChild(closeButton);
}
async function closeDialog(e) {
  memoryGameDialog.close();
  await petPlay(gamelevel);
}
function rightAnswer() {
  game.classList.add('right');
  setInterval(() => {
    game.classList.remove('right');
  }
  , 1000);
  playing = true;
  nextLevel(++gamelevel);
  levelIndicator.textContent = 'Level: ' + gamelevel;
  playCom = [];
}
function memoryGameClickHandler(e) {
  if (!playing) {
    e.target.style = 'background-color: green';
    setTimeout(() => { e.target.style = 'background-color: lime'; }, 100);
    playCom.push(Number(e.target.id[5]));
    for (let i = 0; i < playCom.length; i++) {
      if (combination[i] !== playCom[i]) {
        combination = [];
        playCom = [];
        endGame(Number(e.target.id[5]));
        return;
      }
    }
    if (playCom.toString() === combination.toString()) {
      rightAnswer();
    }
  }
}
function nextLevel(lvl) {
  let counter = 0;
  let spaceElement;
  function nextSpace() {
    const space = Math.floor(Math.random() * 9) + 1;

    combination.push(space);
  }

  function playSequence() {
    console.log(combination);
    const space = combination[counter];
    console.log(space);
    spaceElement = document.querySelector('#space' + space);
    spaceElement.style = 'background-color: red';
    setTimeout(() => { spaceElement.style = 'background-color: lime'; }, 500);
    counter++;
    if (counter === lvl) {
      clearInterval(intId);
      setTimeout(() => { playing = false; }, 1000);
      counter = 0;
    }
  }

  nextSpace();
  const intId = setInterval(playSequence, 1000);
}
// higher or lower game

function startHigherOrLower() {
  holScore = 0;
  holScoreEl.textContent = holScore;
  higher.classList.remove('hide');
  lower.classList.remove('hide');
  holclose.classList.add('hide');
  const cardStack = document.createElement('object');
  cardStack.type = 'image/svg+xml';
  cardStack.id = 'cardstack';
  cardStack.data = '/svgassets/cardstack.svg';
  holGameDialog.showModal();
  firstCard();
}


function firstCard() {
  // const cardStack = document.querySelector('#cardstack');
  topCard.classList.remove('hide');
  dupeCard.classList.add('hide');
  const randomNumber = Math.round(Math.random() * MAX_HOL_NUMBER);
  cardNumber.textContent = randomNumber;
  dupeCardNumber.textContent = randomNumber;
  dupeCardNumber.style = 'font-size: 3em; translate: 13px';
  console.log(cardNumber);
  cardNumber.style = randomNumber <= 10 ? 'font-size: 3em;' : 'font-size: 3em; translate: -13px';
  topCard.style.animation = 'moveanimation 0.3s linear 1 normal';
  setTimeout(() => {
    topCard.style = 'transform: translate(200px);';
    topCard.style.animation = 'flipanimation 0.2s linear 1 normal forwards';
  }, 300);
  setTimeout(() => {
    topCard.classList.add('hide');
    dupeCard.classList.remove('hide');
  }, 500);
}
function guess(e) {
  let nextNumber = Math.round(Math.random() * MAX_HOL_NUMBER);
  const currentNumber = Number(cardNumber.textContent);
  console.log(`Next card = ${nextNumber}, currentCard = ${currentNumber}`);
  while (nextNumber === currentNumber) {
    nextNumber = Math.round(Math.random() * MAX_HOL_NUMBER);
  }
  if (e.target.id === 'lower') {
    nextCard(nextNumber, currentNumber, nextNumber < currentNumber);
  } else if (e.target.id === 'higher') {
    nextCard(nextNumber, currentNumber, nextNumber > currentNumber);
  }
}

function endHolGame() {
  higher.classList.add('hide');
  lower.classList.add('hide');
  holclose.classList.remove('hide');
  const boostAmount = holScore * 10 > 100 ? 100 : holScore * 10;
  holBoost.textContent = `You have earned a ${boostAmount}% happiness boost!`;
}

function closeHolDialog() {
  petPlay(holScore);
  holGameDialog.close();
}

function nextCard(nextNumber, currentNumber, correct) {
  dupeCardNumber.textContent = currentNumber;
  dupeCardNumber.style = 'font-size: 3em; translate: 13px';
  topCard.style = '';
  topCard.classList.remove('hide');
  cardNumber.textContent = nextNumber;
  cardNumber.style = nextNumber <= 10 ? 'font-size: 3em;' : 'font-size: 3em; translate: 13px';
  topCard.style.animation = 'moveanimation 0.3s linear 1 normal';
  setTimeout(() => {
    topCard.style = 'transform: translate(200px);';
    topCard.style.animation = 'flipanimation 0.2s linear 1 normal forwards';
  }, 300);
  setTimeout(() => {
    if (correct) {
      holScore += 1;
      holScoreEl.textContent = holScore;
    } else {
      endHolGame();
    }
  }, 300);
}
async function main() {
  await updateMeters();
  playButton.addEventListener('click', startRandomGame);
  feedButton.addEventListener('click', petFeed);
  cleanButton.addEventListener('click', petClean);
  sacrifice.addEventListener('click', sacrificePet);
  higher.addEventListener('click', guess);
  lower.addEventListener('click', guess);
  holclose.addEventListener('click', closeHolDialog);
  cleanSelectMenu.addEventListener('change', () => { handleSelections(confirmClean, cleanSelectMenu); });
  feedSelectMenu.addEventListener('change', () => { handleSelections(confirmFeed, feedSelectMenu); });
  feedDialog.addEventListener('close', () => { sendCareRequest(confirmFeed); });
  cleanDialog.addEventListener('close', () => { sendCareRequest(confirmClean); });
  closeButton.addEventListener('click', closeDialog);
  setupMemoryGame();
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
