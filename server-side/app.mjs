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
const ITEMS = {cleaning: { 'Soap': 20, 'Super Soap': 40, 'Ultra Soap': 90 }, feeding: ['Donut', 'Super Donut', 'Ultra Donut'] };
async function readAccountJson(accountId) {
  const accountsData = await fs.readFile('server-side/pets.json');
  const accounts = JSON.parse(accountsData);
  return accounts[req.params.accountId];
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
      foodItems: {},
      cleanItems: {},
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
  if (accounts[req.params.accountId]?.pets[petName] === undefined) {
    res.status(404).end(`Couldn't find this pet :( ${JSON.stringify(accounts)}`);
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
      };
      console.log(accounts);
      await fs.writeFile('server-side/pets.json', JSON.stringify(accounts));
    }
  }
  res.json(accounts[req.params.accountId]);
}

async function petPlay(req, res) {
  const now = Date.now();
  const account = await readAccountJson(req.params.accountId);
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
async function petClean(req, res) {

}
app.get('/pets', (req, res) => {
  res.sendFile(path.join(path.resolve(__dirname, '..'), '/client-side/pets/index.html'));
});
app.get('/pets/create', (req, res) => {
  res.sendFile(path.join(path.resolve(__dirname, '..'), '/client-side/createpet/index.html'));
});
app.post('/shop/:accountId/', (req, res) => {
  res.sendFile(path.join(path.resolve(__dirname, '..'), '/client-side/shop/index.html'));
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
