const accountId = window.location.pathname.slice(-18);
const NP = document.querySelector('.npcounter');
let shop;

async function buyItem(e) {
  const response = await fetch('http://localhost:8080/shop/' + accountId + '/' + e.currentTarget.id, {
    method: 'POST',
  });
  if (response.ok) {
    const updatedAccount = await response.json();
    console.log(updatedAccount);
    updateShop(updatedAccount);
    addListeners();
  } else if (response.status === 403) {
    console.log('Not enough NP!');
  }
}

function loadShop(payload) {
  shop = payload.shop;
  console.log(payload);
  NP.innerHTML = `NP: <span class="np">${payload.account.NP}</span>`;
  const owned = JSON.parse(payload.account.items);
  console.log(typeof payload.account.items);
  let info;
  let count;

  for (const [k, v] of Object.entries(shop)) {
    if (k === 'pet_blood') { continue; }
    info = document.querySelector('#' + k + 'info');
    count = document.querySelector('#' + k + 'count');
    if (owned[k] !== undefined) {
      count.textContent = `You have: ${owned[k]}`;
    }
    info.textContent = `${shop[k].name} | ${v.cost} NP`;
  }
}

function updateShop(account) {
  NP.innerHTML = `NP: <span class="np">${account.NP}</span>`;
  const owned = account.items;
  let info;
  let count;
  for (const [k, v] of Object.entries(shop)) {
    if (k === 'pet_blood') { continue; }
    info = document.querySelector('#' + k + 'info');
    count = document.querySelector('#' + k + 'count');
    if (owned[k] !== undefined) {
      count.textContent = `You have: ${owned[k]}`;
    }
    info.textContent = `${shop[k].name}\n ${v.cost} NP`;
  }
}
function addListeners() {
  for (const [k] of Object.entries(shop)) {
    const svg = document.querySelector(`#${k}`);
    svg.addEventListener('click', buyItem);
  }
}

async function main() {
  const response = await fetch('http://localhost:8080/shop/' + accountId + '/items');
  const payload = await response.text();
  console.log(payload);
  const data = JSON.parse(payload);
  console.log(data);
  loadShop(data);
  addListeners();
}
window.addEventListener('load', main);
