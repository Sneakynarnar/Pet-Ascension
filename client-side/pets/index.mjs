let data;
let accessToken;
let authType;
async function getJson(id) {
  const response = await fetch(`http://localhost:8080/api/${id}`);
  const pets = await response.json();
  console.log(pets);
  return pets;
}

function wordifyTimeInMilliseconds(time) {
  let days = 0;
  let hours = 0;
  let minutes = 0;
  let seconds = 0;
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
      time = 0;
    }
  }

  return `${days} day(s), ${hours} hour(s), ${minutes} minute(s), ${seconds} second(s),`;
}
async function loadPets(id) {
  console.log('im here');
  const petList = document.querySelector('#petlist');
  const deadPetList = document.querySelector('#deadpetlist');
  const account = await getJson(id);
  const pets = account.pets;
  console.log(pets);

  if (Object.entries(pets).length === 0) {
    const noPets = document.querySelector('#noPets');
    const frag = new URLSearchParams(window.location.hash.slice(1));
    const [accessToken, authType] = [frag.get('access_token'), frag.get('token_type')];
    noPets.innerHTML = `It seems like you haven't creates any pets <a href="http://localhost:8080/pets/create/#token_type=${authType}&access_token=${accessToken}">Click here!</a> to create your pet`;
  }
  const parser = new DOMParser();
  let svgText;
  let colorelements;
  let svgDoc;
  let svg;
  let response;
  let petBlock;
  for (const attr of Object.values(pets)) {
    response = await fetch(`/petsvgs/${attr.type}.svg`);
    svgText = await response.text();
    svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
    svg = svgDoc.querySelector('svg');
    svg.setAttribute('id', attr.petName + 'svg');
    svg.setAttribute('height', '200');
    svg.setAttribute('width', '200');
    petBlock = document.createElement('div');
    petBlock.id = attr.petName;
    petBlock.classList.add('animalpreview');
    petBlock.appendChild(svg);
    console.log(attr);

    const petNameList = attr.petName.split('');
    petNameList[0] = petNameList[0].toUpperCase();
    let petName = '';

    for (const letter of petNameList) {
      petName += letter;
    }
    const petTitle = document.createElement('p');
    petTitle.textContent = petName;
    petTitle.classList.add('pettitle');
    petBlock.appendChild(petTitle);
    const happiness = document.createElement('meter');
    happiness.max = 100;
    happiness.min = 0;
    happiness.low = 25;
    happiness.optimum = 100;
    console.log(attr);
    happiness.value = Number((attr.cleanliness + attr.hunger + attr.fitness) / 3);
    if (attr.dead) {
      petBlock.classList.add('dead');
      const deathReason = document.createElement('p');
      deathReason.classList.add('deathmessage');
      const formattedTime = wordifyTimeInMilliseconds(Date.now() - attr.diedAt);
      deathReason.textContent = `This pet died due to ${attr.deathReason} ${formattedTime} ago`;
      petBlock.appendChild(deathReason);
      deadPetList.appendChild(petBlock);
    } else {
      petBlock.appendChild(happiness);
      petBlock.addEventListener('click', selectPet);
      petList.appendChild(petBlock);
    }
    attr.colors = JSON.parse(attr.colors);

    for (const [part, color] of Object.entries(attr.colors)) {
      colorelements = document.querySelectorAll('.' + attr.type + part);
      for (const elem of colorelements) {
        if (elem.parentElement.parentElement.id === attr.petName + 'svg') {
          for (const child of elem.children) {
            if (part === 'claws') {
              child.style = `fill: ${color}; stroke: ${color};`;
            } else {
              child.style = `fill: ${color}; `;
            }
          }
        }
      }
    }
  }
}


function selectPet(e) {
  window.location.href = `http://localhost:8080/pets/${data.id}/${e.currentTarget.id}#token_type=${authType}&access_token=${accessToken}`;
}


async function main() {
  const frag = new URLSearchParams(window.location.hash.slice(1));
  [accessToken, authType] = [frag.get('access_token'), frag.get('token_type')];
  if (accessToken === null) {
    window.location.href = 'http://localhost:8080/';
  }
  document.querySelector('#createpet').addEventListener('click', () => {
    window.location.href = `http://localhost:8080/pets/create#token_type=${authType}&access_token=${accessToken}`;
  });
  const response = await fetch('https://discord.com/api/users/@me', {
    method: 'GET',
    headers: {
      authorization: `${authType} ${accessToken}`,
    },

  });
  data = await response.json();
  console.log(data.id);
  await loadPets(data.id);
}

window.addEventListener('load', main);
