

const happinessMeter = document.querySelector('#happiness');
const cleanMeter = document.querySelector('#cleanliness');
const hungerMeter = document.querySelector('#hunger');
const petNameTitle = document.querySelector('#petname');
const petContainer = document.querySelector('#petcontainer');
const NPamount = document.querySelector('#NP');
const playButton = document.querySelector('#play');
const cleanButton = document.querySelector('#clean');
const feedButton = document.querySelector('#feed');
const petName = window.location.pathname.slice(25);
const apiPath = window.location.pathname.slice(6);

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

async function main() {
  await updateMeters();
  playButton.addEventListener('click', petPlay);
}
window.addEventListener('load', main);
