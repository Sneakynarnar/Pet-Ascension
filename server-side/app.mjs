/* eslint-disable no-restricted-syntax */
import express from 'express';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import * as PInt from './sqlpetinteractions.mjs';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const PORT = 8080;
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/', express.static('client-side'));

const ITEMS = {
  soap: { name: 'Soap', cost: 20, type: 0, value: 25 },
  supersoap: { name: 'Super Soap', cost: 40, type: 0, value: 50 },
  ultrasoap: { name: 'Ultra Soap', cost: 70, type: 0, value: 100 },
  donut: { cost: 30, name: 'Donut', type: 1, value: 25 },
  superdonut: { cost: 50, name: 'Super Donut', type: 1, value: 50 },
  ultradonut: { cost: 90, name: 'Ultra Donut', type: 1, value: 75 },
};
const connect = PInt.init();
async function createPetReq(req, res) {
  const db = await connect;
  const account = PInt.readAccounts(req.body.id);
  if (account === undefined) {
    res.status(404).send('Invalid account.');
    return;
  }
  const pet = await db.get('SELECT * FROM Pets WHERE accountId = ?', [req.body.name]);
  if (pet === undefined) {
    PInt.createPet(req.body.id, req.body.name, req.body.animaltype, JSON.stringify(req.body.colors), res);
  } else {
    res.status(403).send('A pet already exists with that name!');
  }
}
async function getAccountItems(req, res) {
  const account = await PInt.readAccounts(req.params.accountId);
  if (account === undefined) {
    res.status(404).end('Account not found.');
  } else {
    const data = {
      owned: account.items,
      info: ITEMS,
    };
    res.json(JSON.stringify(data));
  }
}
function showAllPets(req, res) {
  PInt.updatePets(req.params.accountId);
  res.sendFile(path.join(path.resolve(__dirname, '..'), '/client-side/pets/index.html'));
}
async function showSpecificPet(req, res) {
  const petName = req.params.petName;
  const pet = await PInt.getAccountPets(req.params.accountId, petName);
  console.log(`Showing pet: ${JSON.stringify(pet)}`);
  await PInt.updatePets(req.params.accountId);
  if (pet === undefined) {
    res.status(404).end(`Couldn't find this pet :( ${JSON.stringify(pet)}`);
    return;
  }
  res.sendFile(path.resolve('client-side/specificpet/viewpet.html'));
}
function sacrificePetReq(req, res) {
  const account = PInt.readAccounts(req.params.accountId);
  const pet = PInt.getAccountPets(req.params.accountId, req.params.petName,);
  if (account === undefined || pet === undefined) {
    res.status(404).send('Account / Pet not found');
  }
  PInt.petSacrifice(req.params.accountId, req.params.petName, res);
}
async function getPetJson(req, res) {
  res.set('Content-Type', 'application/json');
  const db = await connect;
  const pet = await PInt.getAccountPets(req.params.accountId, req.params.petName);
  if (pet === undefined) {
    res.status(404).end('Not found');
    return;
  }
  const NP = await db.get('SELECT NP FROM Accounts WHERE accountId = ?', req.params.accountId);
  pet.NP = NP.NP;
  res.json(pet);
}
async function getAllAccountJson(req, res) {
  res.set('Content-Type', 'application/json');
  const accountId = req.params.accountId;
  let account = await PInt.readAccounts(accountId);
  console.log(req.body);
  if (account === undefined) {
    account = PInt.createAccount(accountId, req.body.accountName);
  }
  const pets = await PInt.getAccountPets(accountId);
  account.pets = pets;
  res.json(account);
}
async function petPlay(req, res) {
  const boost = req.body.boost;
  const account = await PInt.readAccounts(req.params.accountId);
  if (account === undefined) {
    res.status(404).end('Account not found,');
    return;
  }
  PInt.petPlay(req.params.accountId, req.params.petName, Number(boost), res);
}
async function petCareReq(req, res) {
  await PInt.petCare(req.body.item, req.params.accountId, req.params.petName, res);
}
async function purchaseItemReq(req, res) {
  const item = ITEMS[req.params.item];
  if (item !== undefined) {
    await PInt.purchaseItem(req.params.accountId, req.params.item, res);
  } else {
    res.status(404).end('Item not found');
  }
}
async function guildPet(req, res) {
  const account = await PInt.readAccounts(req.params.accountId);
  if (account === undefined) {
    res.status(404).send('Account not found');
  } else {
    await PInt.guildPet(req.params.accountId, req.params.petName, res);
  }
}

async function getLeaderboardReq(req, res) {
  const leaderboard = await PInt.getLeaderboard();
  await res.json(leaderboard);
}
app.get('/pets', (req, res) => {
  res.sendFile(path.join(path.resolve(__dirname, '..'), '/client-side/pets/index.html'));
});
app.get('/leaderboard', (req, res) => {
  res.sendFile(path.join(path.resolve(__dirname, '..'), '/client-side/leaderboard/leaderboard.html'));
});
app.get('/pets/create', (req, res) => {
  res.sendFile(path.join(path.resolve(__dirname, '..'), '/client-side/createpet/index.html'));
});
app.get('/shop/:accountId/items', async (req, res) => {
  res.json({
    shop: ITEMS,
    account: await PInt.readAccounts(req.params.accountId),
  });
});
app.get('/shop/:accountId/', (req, res) => {
  res.sendFile(path.join(path.resolve(__dirname, '..'), '/client-side/shop/index.html'));
});
app.post('/shop/:accountId/:item', express.json(), purchaseItemReq);
app.post('/pets/create', express.json(), createPetReq);
app.post('/api/:accountId/:petName/play', petPlay);
app.post('/api/:accountId/:petName/care', petCareReq);
app.post('/pets/:accountId/:petName/sacrifice', sacrificePetReq);
app.post('/pets/:accountId/:petName/guild', guildPet);
app.post('/api/:accountId', express.json(), getAllAccountJson);
app.get('/pets', showAllPets);
app.get('/pets/:accountId/:petName', showSpecificPet);
app.get('/api/leaderboard', getLeaderboardReq);
app.get('/api/:accountId/items', getAccountItems);
app.get('/api/:accountId/:petName', getPetJson);


app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});

