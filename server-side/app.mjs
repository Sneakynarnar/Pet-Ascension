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
const HAPPINESS_DECAY = 6;
const ALLOWED_PLAYS_PER_SESSION = 3;
const PLAY_COOLDOWN_HOURS = 2;
const FEED_COOLDOWN_HOURS = 3;
async function getAccountJson(accountId) {
  const data = await fs.readFile('server-side/pets.json');
  const accounts = JSON.parse(data);
  if (accounts[accountId] === undefined) {
    accounts[accountId] = {
      NP: 100,
      pets: {},
    };
    console.log(accounts);
    await fs.writeFile('server-side/pets.json', JSON.stringify(accounts));
  }
  return accounts[accountId].pets;
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
  const accountId = req.params.accountId;
  const accountsData = await fs.readFile('server-side/pets.json');
  const accounts = JSON.parse(accountsData);
  const petName = req.params.petName;
  await updatePets(accountId);
  if (accounts[accountId]?.pets[petName] === undefined) {
    res.status(404).end(`Couldn't find this pet :( ${JSON.stringify(accounts)}`);
    return;
  }
  res.sendFile(path.resolve('client-side/specificpet/viewpet.html'));
}

async function getPetJson(req, res) {
  res.set('Content-Type', 'application/json');
  const accountsData = await fs.readFile('server-side/pets.json');
  const accounts = JSON.parse(accountsData);
  const account = accounts[req.params.accountId];

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
  const accountsData = await fs.readFile('server-side/pets.json');
  const accounts = JSON.parse(accountsData);
  const account = accounts[req.params.accountId];
  const lastPlayed = now - account.pets[req.params.petName].last_play_update;
  const playCount = account.pets[req.params.petName].playCount;
  if (lastPlayed > hour * PLAY_COOLDOWN_HOURS || playCount <= PLAY_COOLDOWN_HOURS) {
    if (playCount === ALLOWED_PLAYS_PER_SESSION) {
      account.pets[req.params.petName].last_play_update = Date.now();
      account.pets[req.params.petName].playCount = 0;
    }
    account.pets[req.params.petName].happiness += 20;
    account.pets[req.params.petName].playCount++;
    await fs.writeFile('server-side/pets.json', JSON.stringify(accounts));
    res.status(200).end('Happiness increased');
  } else {
    res.status(403).end('Forbidden');
  }
}
async function petFeed(req, res) {
  const now = Date.now();
  const accountsData = await fs.readFile('server-side/pets.json');
  const accounts = JSON.parse(accountsData);
  const account = accounts[req.params.accountId];
  const lastFed = now - account.pets[req.params.petName].last_feed_update;
  
  if (lastFed * FEED_COOLDOWN_HOURS) {

  }
}
app.get('/pets', (req, res) => {
  res.sendFile(path.join(path.resolve(__dirname, '..'), '/client-side/pets/index.html'));
});
app.get('/pets/create', (req, res) => {
  res.sendFile(path.join(path.resolve(__dirname, '..'), '/client-side/createpet/index.html'));
});
app.post('/pets/create', express.json(), createPet);
app.post('/api/:accountId/:petName/play', petPlay);
app.get('/pets', showAllPets);
app.get('/pets/:accountId/:petName', showSpecificPet);
app.get('/api/:accountId', getAllAccountJson);
app.get('/api/:accountId/:petName', getPetJson);
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});