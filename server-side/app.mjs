import express from 'express';
import fs from 'fs/promises';
import path from 'path';
const app = express();
const PORT = 8080;
// app.use(express.static("./client-side/homepage"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/', express.static('client-side'));
// app.use("/pets", express.static(path.join(__dirname, "client-side/pets")))
// app.get("/", (req, res) => {
//     res.sendFile(path.join(path.resolve(__dirname, ".."), "/client-side/homepage/index.html"));
// })

const HUNGER_DECAY = 3;
const CLEANLINESS_DECAY = 5;
const HAPPINESS_DECAY = 6;

const BASE_NP_RATE = 5;
async function getJson() {
  const data = await fs.readFile('server-side/pets.json');
  const pets = JSON.parse(data);
  return pets;
}
async function createPet(req, res) {
  const data = await fs.readFile('server-side/pets.json');
  const pets = JSON.parse(data);
  if (pets[req.body.name] === undefined) {
    const defaultLastInteract = Date.now() - 36000000; // Last interact by default is set to 5 hours ago
    const now = Date.now();
    console.log(req.body.antype);
    pets[req.body.name.toLowerCase()] = {
      dateCreated: now,
      type: req.body.animaltype,
      cleanliness: 100,
      happiness: 100,
      hunger: 100,
      level: 1,
      rank: 1,
      last_feed_update: defaultLastInteract,
      last_play_update: defaultLastInteract,
      last_clean_update: defaultLastInteract,
      last_updated: now,
      dead: false,
    };
  } else {
    res.send('A pet already exists with that name!');
  }
  fs.writeFile('server-side/pets.json', JSON.stringify(pets));
  res.send('Created pet!');
}


async function updatePets() {
  const pets = await getJson();
  const hour = 1000 * 3600;
  let now = Date.now();
  for (const [pet, value] of Object.entries(pets)) {
    value.hunger -= ((now - value.last_feed_update) / hour) * HUNGER_DECAY;
    value.happiness -= ((now - value.last_play_update) / hour) * HAPPINESS_DECAY;
    value.cleanliness -= ((now - value.last_clean_update) / hour) * CLEANLINESS_DECAY;
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
  await fs.writeFile('server-side/pets.json', JSON.stringify(pets));
  console.log(pets);
  return pets;
}
async function showAllPets(req, res) {
  updatePets();
  res.sendFile(path.join(path.resolve(__dirname, '..'), '/client-side/pets/index.html'));
  const data = await fs.readFile('server-side/pets.json');
}
async function showSpecificPet(req, res) {
  updatePets();
  const petName = req.params.petName;
  const pets = await getJson();
  if (pets[petName] === undefined) {
    res.status(404).end('Not found');
    return;
  }
  res.sendFile(path.resolve('client-side/specificpet/viewpet.html'));
}

async function getPetJson(req, res) {
  res.set('Content-Type', 'application/json');
  const pets = await getJson();
  if (pets[req.params.petName] === undefined) {
    res.status(404).end('Not found');
    return;
  }
  res.json(pets[req.params.petName]);
}

async function getAllPetJson(req, res) {
  res.set('Content-Type', 'application/json');
  const pets = await getJson();
  res.json(pets);
}

app.post('/pets', express.json(), createPet);
app.get('/pets', showAllPets);
app.get('/pets/:petName', showSpecificPet);
app.get('/api', getAllPetJson);
app.get('/api/:petName', getPetJson);


app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
