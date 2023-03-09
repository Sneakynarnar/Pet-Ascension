
const inputBox = document.querySelector('#petname');
const submit = document.querySelector('#postcreatereq');
const invalidText = document.querySelector('#invalidText');
let selectedAnimal = null;
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
    return;
  } else {
    invalidText.textContent = '';
  }
  const petJson = {
    id: discordId,
    name: inputBox.value,
    animaltype: selectedAnimal,
    animalcolors: null,
  };
  console.log(petJson);
  const response = await fetch('http://localhost:8080/pets/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(petJson),
  });
  if (response.ok) {
    window.location = `http://localhost:8080/pets/${discordId}/` + petJson.name;
    console.log('done');
  }
}


function selectAnimal(e) {
  document.querySelector('#dog').classList.remove('selected');
  document.querySelector('#cat').classList.remove('selected');
  document.querySelector('#bunny').classList.remove('selected');

  e.target.classList.add('selected');
  console.log(e.target.id);

  selectedAnimal = e.target.id;
}
async function main() {
  const frag = new URLSearchParams(window.location.hash.slice(1));
  const [accessToken, authType] = [frag.get('access_token'), frag.get('token_type')];
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
  document.querySelector('#petname').addEventListener('input', inputHandler);
  console.log(document.querySelector('#dog'),
  );

  document.querySelector('#dog').addEventListener('click', selectAnimal);
  document.querySelector('#cat').addEventListener('click', selectAnimal);
  document.querySelector('#bunny').addEventListener('click', selectAnimal);

  submit.addEventListener('click', (e) => {
    createPetRequest(e, data.id);
  });
  console.log('Got to main!');
}

window.addEventListener('load', main);
