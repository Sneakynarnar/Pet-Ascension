/* eslint-disable no-restricted-syntax */
import express from 'express';
import fs from 'fs/promises';
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
async function createPetReq(req, res) {
  const data = await fs.readFile('server-side/pets.json');
  const accounts = JSON.parse(data);
  const pets = accounts[req.body.id]?.pets;
  if (pets === undefined) {
    res.status(404).send('Invalid account.');
  }
  if (pets[req.body.name.toLowerCase()] === undefined) {
    PInt.createPet(req.body.id, req.body.name, req.body.antype);
  } else {
    res.send('A pet already exists with that name!');
  }
}
async function getAccountItems(req, res) {
  const account = await PInt.readAccounts(req.params.accountId);
  if (account === undefined) {
    res.status(404).end('Account not found.');
  } else {
    res.json({
      owned: account.items,
      info: ITEMS,
    });
  }
}
function showAllPets(req, res) {
  PInt.updatePets(req.params.accountId);
  res.sendFile(path.join(path.resolve(__dirname, '..'), '/client-side/pets/index.html'));
}
async function showSpecificPet(req, res) {
  const account = await PInt.readAccounts(req.params.accountId);
  const petName = req.params.petName;
  await PInt.updatePets(req.params.accountId);
  if (account?.pets[petName] === undefined) {
    res.status(404).end(`Couldn't find this pet :( ${JSON.stringify(account)}`);
    return;
  }
  res.sendFile(path.resolve('client-side/specificpet/viewpet.html'));
}
async function getPetJson(req, res) {
  res.set('Content-Type', 'application/json');
  const account = await PInt.readAccountJson(req.params.accountId);
  const pets = await account.pets;
  if (pets === undefined || pets[req.params.petName] === undefined) {
    res.status(404).end('Not found');
    return;
  }
  const pet = pets[req.params.petName];
  pet.NP = account.NP;
  res.json(pet);
}
async function getAllAccountJson(req, res) {
  res.set('Content-Type', 'application/json');
  const accountsData = await fs.readFile('server-side/pets.json');
  const accounts = JSON.parse(accountsData);
  if (accounts[req.params.accountId] === undefined) {
    if (accounts[req.params.accountId] === undefined) {
      PInt.createAccount(req.params.accountId);
    }
  }
  res.json(accounts[req.params.accountId]);
}
async function petPlay(req, res) {
  const accounts = await PInt.readAccounts();
  const account = accounts[req.params.accountId];
  if (account === undefined) {
    res.status(404).end('Account not found,');
    return;
  }
  PInt.petPlay(req.params.accountId, req.params.petName, res);
}
async function petCareReq(req, res) {
  const thing = await PInt.petCare(req.body.item, req.params.accountId, req.params.petName, res);
}
async function purchaseItemReq(req, res) {
  const item = ITEMS[req.params.item];
  if (item !== undefined) {
    await PInt.purchaseItem(req.params.accountId, req.params.item, res);
  } else {
    res.status(404).end('Item not found');
  }
}
app.get('/pets', (req, res) => {
  res.sendFile(path.join(path.resolve(__dirname, '..'), '/client-side/pets/index.html'));
});
app.get('/pets/create', (req, res) => {
  res.sendFile(path.join(path.resolve(__dirname, '..'), '/client-side/createpet/index.html'));
});
app.get('/shop/:accountId/items', async (req, res) => {
  res.json({
    shop: ITEMS,
    account: await PInt.readAccountJson(req.params.accountId),
  });
});
app.get('/shop/:accountId/', (req, res) => {
  res.sendFile(path.join(path.resolve(__dirname, '..'), '/client-side/shop/index.html'));
});
app.post('/shop/:accountId/:item', express.json(), purchaseItemReq);
app.post('/pets/create', express.json(), createPetReq);
app.post('/api/:accountId/:petName/play', petPlay);
app.post('/api/:accountId/:petName/care', petCareReq);
app.get('/pets', showAllPets);
app.get('/pets/:accountId/:petName', showSpecificPet);
app.get('/api/:accountId', getAllAccountJson);
app.get('/api/:accountId/items', getAccountItems);
app.get('/api/:accountId/:petName', getPetJson);
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
