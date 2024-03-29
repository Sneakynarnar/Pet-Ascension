
const inputBox = document.querySelector('#petname');
const submit = document.querySelector('#postcreatereq');
const invalidText = document.querySelector('#invalidText');
let selectedAnimal = null;
const colorPickers = document.querySelectorAll('.colorpick');
const nosecolor = document.querySelector('#nose');
const bodycolor = document.querySelector('#body');
const clawcolor = document.querySelector('#claws');
const bellycolor = document.querySelector('#belly');
const earcolor = document.querySelector('#ears');
let accessToken;
let authType;
function inputHandler(e) {
  const name = e.target.value;
  const allowedCharacters = 'qwertyuiopasdfghjklzxcvbnm1234567890';
  let invalid = false;
  for (const char of name) {
    if (!allowedCharacters.includes(char)) {
      inputBox.classList.add('invalid');
      invalid = true;
      submit.disabled = true;
      invalidText.textContent = 'Only lower case letters and numbers are allowed.';
      break;
    }
  }
  if (!invalid && inputBox.classList.contains('invalid')) {
    inputBox.classList.remove('invalid');
    submit.disabled = false;
    invalidText.textContent = '';
  }
}

async function createPetRequest(e, discordId) {
  if (selectedAnimal === null) {
    invalidText.textContent = 'You have not selected an animal type!';
    window.location.href = '#top';
    return;
  } else if (inputBox.value === '') {
    window.location.href = '#top';
    invalidText.textContent = 'You have not named your pet!';
  } else {
    invalidText.textContent = '';
  }
  if (submit.disabled) {
    console.log('blocked');
    return;
  }
  const petJson = {
    id: discordId,
    name: inputBox.value,
    animaltype: selectedAnimal,
    colors: {
      claws: clawcolor.value,
      nose: nosecolor.value,
      belly: bellycolor.value,
      ears: earcolor.value,
      body: bodycolor.value,
    },
  };
  console.log('fetching..');

  const response = await fetch('http://localhost:8080/pets/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(petJson),
  });
  console.log('is this even being ran?');
  if (response.ok) {
    window.location.href = `http://localhost:8080/pets/${discordId}/` + petJson.name + `#token_type=${authType}&access_token=${accessToken}`;
    console.log('done');
  } else {
    invalidText.textContent = await response.text();
  }
}

function handleColorChange(e) {
  const colorelements = document.querySelectorAll('.pre' + selectedAnimal + e.target.id.slice(-5));
  console.log(e.target.id.slice(-5));
  for (const elem of colorelements) {
    elem.style = `fill: ${e.target.value}; `;
    if (e.target.id.slice(-5) === 'claws') {
      elem.style = `fill: ${e.target.value}; stroke: ${e.target.value};`;
      console.log(elem);
    }
  }
}
function selectAnimal(e) {
  document.querySelector('#dog').classList.remove('selected');
  document.querySelector('#cat').classList.remove('selected');
  document.querySelector('#bunny').classList.remove('selected');
  document.querySelector('#dogpre').classList.add('notpreviewed');
  document.querySelector('#catpre').classList.add('notpreviewed');
  document.querySelector('#bunnypre').classList.add('notpreviewed');
  console.log(e.target.parentElement.parentElement.classList);
  e.currentTarget.classList.add('selected');
  selectedAnimal = e.currentTarget.classList.item(1);
  console.log(`selected (${selectedAnimal})`);
  if (selectedAnimal === 'bunny') {
    nosecolor.disabled = false;
    bodycolor.disabled = false;
    clawcolor.disabled = false;
    bellycolor.disabled = false;
    earcolor.disabled = false;
    console.log(bellycolor.disabled);
  } else if (selectedAnimal === 'cat') {
    nosecolor.disabled = false;
    bodycolor.disabled = false;
    clawcolor.disabled = false;
    bellycolor.disabled = true;
    earcolor.disabled = true;
  } else {
    nosecolor.disabled = false;
    bodycolor.disabled = false;
    clawcolor.disabled = false;
    bellycolor.disabled = true;
    earcolor.disabled = false;
  }
  document.querySelector(`#${selectedAnimal}pre`).classList.remove('notpreviewed');
}
async function main() {
  const frag = new URLSearchParams(window.location.hash.slice(1));
  [accessToken, authType] = [frag.get('access_token'), frag.get('token_type')];
  if (accessToken === null) {
    window.location.href = 'http://localhost:8080/';
  }
  const response = await fetch('https://discord.com/api/users/@me', {
    method: 'GET',
    headers: {
      authorization: `${authType} ${accessToken}`,
    },

  });
  const data = await response.json();
  document.querySelector('#topets').href = `http://localhost:8080/pets#token_type=${authType}&access_token=${accessToken}`;
  document.querySelector('#petname').addEventListener('input', inputHandler);
  for (const picker of colorPickers) {
    picker.addEventListener('change', handleColorChange);
  }
  document.querySelector('#dog').addEventListener('click', selectAnimal);
  document.querySelector('#cat').addEventListener('click', selectAnimal);
  document.querySelector('#bunny').addEventListener('click', selectAnimal);

  submit.addEventListener('click', (e) => {
    createPetRequest(e, data.id);
  });
  console.log('Got to main!');
}

window.addEventListener('load', main);
