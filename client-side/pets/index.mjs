

async function getJson(id) {
  const response = await fetch(`http://localhost:8080/api/${id}`);
  const pets = await response.json();
  return pets;
}
async function loadPets(id) {
  const petList = document.querySelector('#petlist');
  const pets = await getJson(id);
  let listNode;
  let link;
  if (Object.entries(pets).length === 0) {
    const noPets = document.querySelector('#noPets');
    const frag = new URLSearchParams(window.location.hash.slice(1));
    const [accessToken, authType] = [frag.get('access_token'), frag.get('token_type')];
    noPets.innerHTML= `It seems like you haven\'t creates any pets <a href="http://localhost:8080/pets/create/#token_type=${authType}&access_token=${accessToken}">Click here!</a> to create your pet`;
  }
  for (const [name, attr] of Object.entries(pets)) {
    listNode = document.createElement('li');
    link = document.createElement('a');
    link.href = 'http://localhost:8080/pets/' + name.toLowerCase();
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
