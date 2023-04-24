
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
const feedPetPreview = document.querySelector('#feedpetpreview');
const feedMeterPreview = document.querySelector('#hungerpreview');
const cleanMeterPreview = document.querySelector('#cleanpreview');
const cleanPetPreview = document.querySelector('#cleanpetpreview');
const sacrificeDialog = document.querySelector('#sacrificedialog');
const sacrificePetPreview = document.querySelector('#sacrificepetcontainer');
const guildDialog = document.querySelector('#guilddialog');
const guildButton = document.querySelector('#guild');
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
  if (petStats.level < 15) {
    sacrifice.disabled = false;
  }
  XPcounter.textContent = `${petStats.XP}/10000`;

  for (const elem of document.querySelectorAll(`#${petStats.type}pre`)) {
    elem.classList.remove('notpet');
  }
  NPamount.textContent = `NP: ${petStats.NP}`;
  petNameTitle.textContent = petName;
  let colorelements;
  petStats.colors = JSON.parse(petStats.colors);
  for (const [part, color] of Object.entries(petStats.colors)) {
    colorelements = document.querySelectorAll('.pre' + petStats.type + part);
    for (const elem of colorelements) {
      elem.style = `fill: ${color}; `;
    }
  }
  const guildColor = petStats.rank === 2 ? '#ff0000' : '#ffffff';
  if (petStats.rank !== 1) {
    document.querySelectorAll('.eyes').forEach(elem => {
      elem.style = `fill: ${guildColor};`;
    });
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
  hungerMeter.value = feedMeterPreview.value = Math.round(petStats.hunger);
  cleanMeter.value = cleanMeterPreview.value = Math.round(petStats.cleanliness);
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


async function petFeed() {
  let counter;
  for (const [item, count] of Object.entries(payload.owned)) {
    if (item === 'pet_blood') {
      continue;
    }
    if (payload.info[item].type === 1) {
      console.log(item);
      counter = document.querySelector(`#${item}count`);
      counter.textContent = count;
    }
  }
  await updateMeters();
  feedDialog.showModal();
}
async function petClean() {
  let counter;
  for (const [item, count] of Object.entries(payload.owned)) {
    if (item === 'pet_blood') {
      continue;
    }
    if (payload.info[item].type === 0) {
      console.log(item);
      counter = document.querySelector(`#${item}count`);
      counter.textContent = count;
    }
  }
  await updateMeters();
  cleanDialog.showModal();
}
async function sacrificePet() {
  if (petStats.level > 15) {
    document.querySelector('#sacrificestatus').textContent = await sacrificePetReq();
  } else {
    document.querySelector('#sacrificestatus').textContent = 'pet not a high enough level';
  }
}


async function sacrificePetReq() {
  const response = await fetch('http://localhost:8080/pets/' + apiPath + '/sacrifice', {
    method: 'POST',
  });
  if (response.ok) {
    await updateMeters();
  }
  return await response.text();
}

async function guildPetReq() {
  const response = await fetch('http://localhost:8080/pets/' + apiPath + '/guild', {
    method: 'POST',
  });
  document.querySelector('#guildstatus').textContent = await response.text();
}


async function sendCareRequest(item) {
  const response = await fetch('http://localhost:8080/api/' + apiPath + '/care', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ item }),
  });
  if (response.ok) {
    await updateMeters();
  } else {
    return response;
  }
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
function handleDrag(e) {
  // e.preventDefault();
  console.log(e.target.id);
  e.dataTransfer.setData('text/plain', e.target.id);
  if (e.target.id === 'knife') {
    return;
  }
  const counterElement = document.querySelector(`#${e.target.id}count`);
  counterElement.textContent = Number(counterElement.textContent) - 1;
  e.dataTransfer.effectAllowed = 'copy';
}
function handleDragEnter(e) {
  if (e.currentTarget.id === sacrificePetPreview.id) {
    sacrificePetPreview.classList.add('killhighlight');
    return;
  }
  e.currentTarget.classList.add('over');
}
function handleDragLeave(e) {
  if (e.currentTarget.id === sacrificePetPreview.id) {
    sacrificePetPreview.classList.remove('killhighlight');

    return;
  }
  e.currentTarget.classList.remove('over');
}
function handleDragOver(e) {
  e.preventDefault();
  if (e.currentTarget.id === sacrificePetPreview.id) {
    sacrificePetPreview.classList.add('killhighlight');
    return;
  }
  e.currentTarget.classList.add('over');
  e.dataTransfer.dropEffect = 'copy';
}
async function handleDrop(e) {
  console.log('dropped');
  e.preventDefault();
  const data = e.dataTransfer.getData('text/plain');
  console.log(data);
  if (data === 'knife') {
    await sacrificePet();
    return;
  }
  console.log(payload.owned[data]);
  if (payload.owned[data] > 0) {
    const response = await sendCareRequest(data);
    if (response.ok) {
      if (payload.info[data].type === 1) {
        feedMeterPreview.value += payload.info[data].value;
      } else {
        cleanMeterPreview.value += payload.info[data].value;
      }
    } else {
      console.log(await response.text());
    }
  }
}
function handleDragCancel(e) {
  e.preventDefault();
  const data = e.dataTransfer.getData('text/plain');
  console.log(data);
  if (data === 'knife') {
    return;
  }
  if (e.dataTransfer.dropEffect === 'none') {
    const counterElement = document.querySelector(`#${e.target.id}count`);
    counterElement.textContent = Number(counterElement.textContent) + 1;
  }
}
async function main() {
  await updateMeters();
  playButton.addEventListener('click', startRandomGame);
  feedButton.addEventListener('click', petFeed);
  cleanButton.addEventListener('click', petClean);
  guildButton.addEventListener('click', guildPetReq);
  document.querySelector('#guildpetbutton').addEventListener('click', () => {
    document.querySelector('#guilddialog').showModal();
  });
  sacrifice.addEventListener('click', () => {
    sacrificeDialog.showModal();
  });
  higher.addEventListener('click', guess);
  lower.addEventListener('click', guess);
  holclose.addEventListener('click', closeHolDialog);
  for (const preview of [feedPetPreview, cleanPetPreview, sacrificePetPreview]) {
    preview.addEventListener('dragover', handleDragOver);
    preview.addEventListener('dragenter', handleDragEnter);
    preview.addEventListener('dragleave', handleDragLeave);
    preview.addEventListener('drop', handleDrop);
  }
  document.querySelector('#cancelfeed').addEventListener('click', () => {
    feedPetPreview.classList.remove('over');
    feedDialog.close();
  });
  document.querySelector('#cancelclean').addEventListener('click', () => {
    cleanPetPreview.classList.remove('over');
    cleanDialog.close();
  });
  document.querySelector('#sacrificecancel').addEventListener('click', () => {
    sacrificeDialog.close();
  });
  document.querySelector('#guildcancel').addEventListener('click', () => {
    guildDialog.close();
  });
  // cleanSelectMenu.addEventListener('change', () => { handleSelections(confirmClean, cleanSelectMenu); });
  // feedSelectMenu.addEventListener('change', () => { handleSelections(confirmFeed, feedSelectMenu); });
  closeButton.addEventListener('click', closeDialog);
  const items = document.querySelectorAll('.item');
  for (const elem of items) {
    elem.addEventListener('dragstart', handleDrag);
    elem.addEventListener('dragend', handleDragCancel);
    console.log(elem);
  }
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
