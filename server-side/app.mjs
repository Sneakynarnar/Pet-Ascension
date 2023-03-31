import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const PORT = 8080;
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/', express.static('client-side'));
const hour = 1000 * 3600;
const HUNGER_DECAY = 3;
const CLEANLINESS_DECAY = 5;
const HAPPINESS_DECAY = 3000;
const ALLOWED_PLAYS_PER_SESSION = 3;
const PLAY_COOLDOWN_HOURS = 1 / 360;
const FEED_COOLDOWN_HOURS = 3;
const ITEMS = { soap: { name: 'Soap', cost: 20, type: 0, value: 25 }, supersoap: { name: 'Super Soap', cost: 40, type: 0, value: 50 }, ultrasoap: { name: 'Ultra Soap', cost: 70, type: 0, value: 100 }, donut: { cost: 30, name: 'Donut', type: 1, value: 25 }, superdonut: { cost: 50, name: 'Super Donut', type: 1, value: 50 }, ultradonut: { cost: 90, name: 'Ultra Donut', type: 1, value: 75 } };
async function readAccountJson(accountId = null) {
  const accountsData = await fs.readFile('server-side/pets.json');
  const accounts = JSON.parse(accountsData);
  if (accountId !== null) {
    return accounts[accountId];
  } else {
    return accounts;
  }
}
async function createPet(req, res) {
  console.log('Creating pet');
  const data = await fs.readFile('server-side/pets.json');
  const accounts = JSON.parse(data);
  console.log(accounts);
  let pets = accounts[req.body.id]?.pets;
  console.log(pets);
  if (pets === undefined) {
    accounts[req.body.id] = {
      NP: 100,
      pets: {},
      items: {},
    };
    pets = accounts[req.body.id].pets;
  }
  if (pets[req.body.name.toLowerCase()] === undefined) {
    const defaultLastInteract = Date.now() - 36000000; // Last interact by default is set to 5 hours ago
    const now = Date.now();
    accounts[req.body.id].pets[req.body.name.toLowerCase()] = {
      dateCreated: now,
      type: req.body.animaltype,
      cleanliness: 100,
      happiness: 100,
      hunger: 100,
      level: 1,
      XP: 0,
      rank: 1,
      last_feed_update: defaultLastInteract,
      last_play_update: defaultLastInteract,
      playCount: 0,
      last_clean_update: defaultLastInteract,
      last_updated: now,
      dead: false,
    };
    await fs.writeFile('server-side/pets.json', JSON.stringify(accounts));
    console.log('Created new pet!');
  } else {
    res.send('A pet already exists with that name!');
  }
}
async function updatePets(accountId) {
  const petsData = await fs.readFile('server-side/pets.json');
  const accounts = JSON.parse(petsData);
  if (accounts[accountId] === undefined) { return null; }
  const pets = accounts[accountId].pets;
  let now = Date.now();
  for (const [pet, value] of Object.entries(pets)) {
    value.hunger -= Math.round(((now - value.last_feed_update) / hour) * HUNGER_DECAY);
    value.happiness -= Math.round(((now - value.last_play_update) / hour) * HAPPINESS_DECAY);
    value.cleanliness -= Math.round(((now - value.last_clean_update) / hour) * CLEANLINESS_DECAY);
    value.hunger = value.hunger < 0 ? 0 : value.hunger;
    value.cleanliness = value.cleanliness < 0 ? 0 : value.cleanliness;
    value.happiness = value.happiness < 0 ? 0 : value.happiness;
    now = Date.now();
    value.last_feed_update = now;
    value.last_play_update = now;
    value.last_clean_update = now;
    value.last_updated = now;
    if (value.hunger <= 0) {
      value.dead = true;
    }
    pets[pet] = value;
  }
  try {
    await fs.writeFile('server-side/pets.json', JSON.stringify(accounts));
  } catch (error) {
    return error;
  }
  return pets;
}
function showAllPets(req, res) {
  updatePets(req.params.accountId);
  res.sendFile(path.join(path.resolve(__dirname, '..'), '/client-side/pets/index.html'));
}
async function showSpecificPet(req, res) {
  const account = await readAccountJson(req.params.accountId);
  const petName = req.params.petName;
  await updatePets(req.params.accountId);
  if (account?.pets[petName] === undefined) {
    res.status(404).end(`Couldn't find this pet :( ${JSON.stringify(account)}`);
    return;
  }
  res.sendFile(path.resolve('client-side/specificpet/viewpet.html'));
}

async function getPetJson(req, res) {
  res.set('Content-Type', 'application/json');
  const account = await readAccountJson(req.params.accountId);
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
  console.log(accounts);
  if (accounts[req.params.accountId] === undefined) {
    if (accounts[req.params.accountId] === undefined) {
      accounts[req.params.accountId] = {
        NP: 100,
        pets: {},
        items: {},
      };
      console.log(accounts);
      await fs.writeFile('server-side/pets.json', JSON.stringify(accounts));
    }
  }
  res.json(accounts[req.params.accountId]);
}

async function petPlay(req, res) {
  const now = Date.now();
  const accounts = await readAccountJson();
  const account = accounts[req.params.accountId];
  const lastPlayed = now - account.pets[req.params.petName].last_play_update;
  const playCount = account.pets[req.params.petName].playCount;
  console.log(` lastPlayed: ${lastPlayed} cooldown: ${hour * PLAY_COOLDOWN_HOURS}`);
  if (lastPlayed > hour * PLAY_COOLDOWN_HOURS || playCount <= ALLOWED_PLAYS_PER_SESSION) {
    if (lastPlayed >= hour * PLAY_COOLDOWN_HOURS) { account.pets[req.params.petName].playCount = 0; }
    if (account.pets[req.params.petName].playCount >= ALLOWED_PLAYS_PER_SESSION) {
      res.status(403).end(`Exceeded plays per ${PLAY_COOLDOWN_HOURS} hour(s) `);
      return;
    }
    account.pets[req.params.petName].happiness += 20;
    account.pets[req.params.petName].playCount++;
    account.pets[req.params.petName].last_play_update = now;
    await fs.writeFile('server-side/pets.json', JSON.stringify(accounts));
    res.status(200).end('Happiness increased');
  } else {
    res.status(403).end('Cannot feed pet');
  }
}
async function petFeed(req, res) {
  const now = Date.now();
  const account = await readAccountJson(req.params.accountId);
  const lastFed = now - account.pets[req.params.petName].last_feed_update;
  if (lastFed > hour * FEED_COOLDOWN_HOURS) {
    account.pets[req.params.petName].last_feed_update = Date.now();
    account.pets[req.params.petName].hunger += 20;
    await fs.writeFile('server-side/pets.json', JSON.stringify(accounts));
    res.status(200).end('Hunger stat increased');
  } else {
    res.status(403).end('Pet refusing to eat');
  }
}
async function petClean(req, res){

}

async function purchaseItem(req, res) {
  const accounts = await readAccountJson();
  const account = accounts[req.params.accountId];
  const item = ITEMS[req.params.item];
  if (item !== undefined) {
    if (account.NP > item.cost) {
      account.NP -= item.cost;
      if (account.items[req.params.item] !== undefined) {
        account.items[req.params.item] += 1;
      } else {
        account.items[req.params.item] = 1;
      }
    } else {
      res.status(403).end('Not enough NP');
      return;
    }
    res.json(account);
    await fs.writeFile('server-side/pets.json', JSON.stringify(accounts));
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
    account: await readAccountJson(req.params.accountId),
  });
});
app.get('/shop/:accountId/', (req, res) => {
  res.sendFile(path.join(path.resolve(__dirname, '..'), '/client-side/shop/index.html'));
});
app.post('/shop/:accountId/:item', express.json(), purchaseItem);
app.post('/pets/create', express.json(), createPet);
app.post('/api/:accountId/:petName/play', petPlay);
app.post('/api/:accountId/:petName/feed', petFeed);
app.post('/api/:accountId/:petName/clean', petClean);
app.get('/pets', showAllPets);
app.get('/pets/:accountId/:petName', showSpecificPet);
app.get('/api/:accountId', getAllAccountJson);
app.get('/api/:accountId/:petName', getPetJson);
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
