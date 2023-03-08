
async function getJson() {
  const response = await fetch('http://localhost:8080/api');
  const pets = await response.json();
  return pets;
}
async function loadPets() {
  const petList = document.querySelector('#petlist');
  const pets = await getJson();
  let listNode;
  let link;
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

  if (accessToken === undefined){
    window.location="http://localhost:8080/"

  }
  await loadPets();
}

window.addEventListener('load', main);
