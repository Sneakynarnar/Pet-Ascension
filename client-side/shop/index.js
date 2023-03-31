const accountId = window.location.pathname.slice(-18);
const feedingSection = document.querySelector('#feeding');
const cleaningSection = document.querySelector('#cleaning');
const NP = document.querySelector('#npindicator');
let shop;

async function buyItem(e) {
  const response = await fetch('http://localhost:8080/shop/' + accountId + '/' + e.target.id.slice(0, -3), {
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
  const account = payload.account;
  NP.textContent = `NP: ${account.NP}`;
  const feedingList = document.createElement('ul');
  const cleaningList = document.createElement('ul');
  let item;
  for (const [k, v] of Object.entries(shop)) {
    item = document.createElement('li');
    item.id = k;
    item.textContent = `${v.name}: ${v.cost} NP`;
    if (account.items[k] !== undefined) {
      item.textContent += ` (You own ${account.items[k]}.)`;
    }
    item.innerHTML += ` <button id ="${k}buy">Buy!</button>`;
    switch (v.type) {
      case 0:
        cleaningList.appendChild(item);
        break;
      case 1:
        feedingList.appendChild(item);
        break;
    }
  }
  cleaningSection.appendChild(cleaningList);
  feedingSection.appendChild(feedingList);
}
function updateShop(account) {
  NP.textContent = `NP: ${account.NP}`;
  let item;
  //console.log(shop);
  for (const [k, v] of Object.entries(shop)) {
    item = document.querySelector(`#${k}`);
    item.textContent = `${v.name}: ${v.cost} NP`;
    if (account.items[k] !== undefined) {
      item.textContent += ` (You own ${account.items[k]}.)`;
    }
    item.innerHTML += ` <button id ="${k}buy">Buy!</button>`;
  }
}
function addListeners() {
  for (const [k] of Object.entries(shop)) {
    const button = document.querySelector(`#${k}buy`);
    button.addEventListener('click', buyItem);
  }
}

async function main() {
  const response = await fetch('http://localhost:8080/shop/' + accountId + '/items');
  const payload = await response.json();
  loadShop(payload);
  addListeners();
}
window.addEventListener('load', main);
