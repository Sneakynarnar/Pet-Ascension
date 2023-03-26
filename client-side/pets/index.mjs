

async function getJson(id) {
  console.log('in getJson');
  const response = await fetch(`http://localhost:8080/api/${id}`);
  const pets = await response.json();
  console.log(response);
  return pets.pets;
}
async function loadPets(id) {
  console.log('im here');
  const petList = document.querySelector('#petlist');
  const pets = await getJson(id);
  let listNode;
  let link;
  console.log(pets);
  if (Object.entries(pets).length === 0) {
    const noPets = document.querySelector('#noPets');
    const frag = new URLSearchParams(window.location.hash.slice(1));
    const [accessToken, authType] = [frag.get('access_token'), frag.get('token_type')];
    // const link = document.createElement('a');
    // link.href = `http://localhost:8080/pets/create/#token_type=${authType}&access_token=${accessToken}`;
    // link.textContent = 'Click here';
    noPets.innerHTML = `It seems like you haven't creates any pets <a href="http://localhost:8080/pets/create/#token_type=${authType}&access_token=${accessToken}">Click here!</a> to create your pet`;
  }
  for (const [name, attr] of Object.entries(pets)) {
    listNode = document.createElement('li');
    link = document.createElement('a');
    link.href = `http://localhost:8080/pets/${id}/${name.toLowerCase()}`;
    link.textContent = name;
    listNode.append(link);
    petList.append(listNode);
  }
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
  console.log(data);
  await loadPets(data.id);
}

window.addEventListener('load', main);
