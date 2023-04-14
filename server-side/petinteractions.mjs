/* eslint-disable no-restricted-syntax */

import fs from 'fs/promises';
const hour = 1000 * 3600;
const HUNGER_DECAY = 2500;
const CLEANLINESS_DECAY = 2000;
const BASE_NP_RATE = 10;
const BASE_LEVEL_BOOST = 10;
const FITNESS_DECAY = 3000;
const FEED_COOLDOWN_HOURS = 1 / 360;
const CLEAN_COOLDOWN_HOURS = 1 / 360;
const ALLOWED_PLAYS_PER_SESSION = 3;
const PLAY_BASE_XP = 250;
const PLAY_COOLDOWN_HOURS = 1 / 360;
const XP_PER_LEVEL = 10000;
const FEED_XP = 250;
const CLEAN_XP = 250;
const ITEMS = {
  soap: { name: 'Soap', cost: 20, type: 0, value: 25 },
  supersoap: { name: 'Super Soap', cost: 40, type: 0, value: 50 },
  ultrasoap: { name: 'Ultra Soap', cost: 70, type: 0, value: 100 },
  donut: { cost: 30, name: 'Donut', type: 1, value: 25 },
  superdonut: { cost: 50, name: 'Super Donut', type: 1, value: 50 },
  ultradonut: { cost: 90, name: 'Ultra Donut', type: 1, value: 75 },
};
export async function purchaseItem(accountId, itemName, res) {
  const accounts = await readAccounts();
  const account = accounts[accountId];
  const item = ITEMS[itemName];
  if (account.NP > item.cost) {
    account.NP -= item.cost;
    if (account.items[itemName] !== undefined) {
      account.items[itemName] += 1;
    } else {
      account.items[itemName] = 1;
    }
  } else {
    res.status(403).end('Not enough NP');
    return;
  }
  res.json(account);
  await fs.writeFile('server-side/pets.json', JSON.stringify(accounts));
}
export async function createPet(accountId, petName, type) {
  const defaultLastInteract = Date.now() - 36000000; // Last interact by default is set to 5 hours ago
  const now = Date.now();
  const accounts = await readAccounts();
  accounts[accountId].pets[petName] = {
    dateCreated: now,
    type,
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
}
export async function readAccounts(accountId = null) {
  const accountsData = await fs.readFile('server-side/pets.json');
  const accounts = JSON.parse(accountsData);
  if (accountId !== null) {
    return accounts[accountId];
  } else {
    return accounts;
  }
}
export async function createAccount(accountId) {
  const accounts = await readAccounts();
  accounts[accountId] = {
    NP: 100,
    pets: {},
    items: {},
  };
  await fs.writeFile('server-side/pets.json', JSON.stringify(accounts));
}
export function calculateNP(happiness, level, rank) {
  return Math.round((BASE_NP_RATE * (1 + (happiness / 100)) * (1 + ((level * BASE_LEVEL_BOOST) / 100))) * rank);
}
export async function handleXPGain(XP, accountId, petName) {
  const accounts = await readAccounts();
  const account = accounts[accountId];
  const pets = account.pets;
  pets[petName].XP += XP;
  while (pets[petName].XP >= XP_PER_LEVEL) {
    pets[petName] -= XP_PER_LEVEL;
    pets[petName].level += 1;
  }
  await fs.writeFile('server-side/pets.json', JSON.stringify(accounts));
}
export async function updatePets(accountId) {
  const petsData = await fs.readFile('server-side/pets.json');
  const accounts = JSON.parse(petsData);
  if (accounts[accountId] === undefined) { return null; }
  const pets = accounts[accountId].pets;
  let now = Date.now();
  let totalNpEarned = 0;
  for (const [pet, value] of Object.entries(pets)) {
    value.hunger -= Math.round(((now - value.last_feed_update) / hour) * HUNGER_DECAY);
    value.fitness -= Math.round(((now - value.last_play_update) / hour) * FITNESS_DECAY);
    value.cleanliness -= Math.round(((now - value.last_clean_update) / hour) * CLEANLINESS_DECAY);
    value.hunger = value.hunger < 0 ? 0 : value.hunger;
    value.cleanliness = value.cleanliness < 0 ? 0 : value.cleanliness;
    value.fitness = value.fitness < 0 ? 0 : value.fitness;
    value.happiness = (value.hunger + value.fitness + value.cleanliness) / 3;
    totalNpEarned += calculateNP(value.happiness, value.level, value.rank);
    now = Date.now();
    value.last_updated = now;
    if (value.hunger <= 0) {
      value.dead = true;
    }
    pets[pet] = value;
  }
  accounts[accountId].NP += totalNpEarned;

  try {
    await fs.writeFile('server-side/pets.json', JSON.stringify(accounts));
  } catch (error) {
    return error;
  }
  return pets;
}

export async function petCare(itemId, accountId, petName, res) {
  const now = Date.now();
  const item = ITEMS[itemId];
  const accounts = await readAccounts();
  const account = accounts[accountId];
  if (item === undefined) {
    res.status(404).send('Cannot find Item.');
    return;
  }
  let cooldown;
  let lastInteract;
  let XP;
  if (item.type === 0) {
    cooldown = CLEAN_COOLDOWN_HOURS;
    lastInteract = now - account.pets[petName].last_clean_update;
    XP = CLEAN_XP;
  } else {
    cooldown = FEED_COOLDOWN_HOURS;
    lastInteract = now - account.pets[petName].last_clean_update;
    XP = FEED_XP;
  }

  if (account === undefined) {
    res.status(404).send('Could not find account');
    return;
  }
  if (account.items[itemId] === undefined || account.items[itemId] <= 0) {
    res.status(403).send('Item is not owned by the account');
    return;
  }
  console.log(`lastInteract ${lastInteract / (1000)} seconds ago`);
  console.log(cooldown * hour);
  if (lastInteract > hour * cooldown) {
    if (item.type === 0) {
      account.pets[petName].last_clean_update = Date.now();
      account.pets[petName].cleanliness += item.value;
    } else {
      account.pets[petName].last_feed_update = Date.now();
      account.pets[petName].hunger += item.value;
    }
    handleXPGain(XP, account, petName);
    account.items[itemId] -= 1;
    await fs.writeFile('server-side/pets.json', JSON.stringify(accounts));
    res.status(200).send('Stat increased!');
  } else {
    res.status(403, 'Pet refusing to eat');
  }
}
export async function petPlay(accountId, petName, res) {
  const now = Date.now();
  const accounts = await readAccounts();
  const account = accounts[accountId];
  const lastPlayed = now - account.pets[petName].last_play_update;
  const playCount = account.pets[petName].playCount;
  console.log(` lastPlayed: ${lastPlayed / 1000 * 60}  seconds ago cooldown: ${PLAY_COOLDOWN_HOURS / 1000 * 60}`);
  if (lastPlayed > hour * PLAY_COOLDOWN_HOURS || playCount <= ALLOWED_PLAYS_PER_SESSION) {
    if (lastPlayed >= hour * PLAY_COOLDOWN_HOURS) { account.pets[petName].playCount = 0; }
    if (account.pets[petName].playCount >= ALLOWED_PLAYS_PER_SESSION) {
      res.status(403).end(`Exceeded plays per ${PLAY_COOLDOWN_HOURS} hour(s) `);
      return;
    }
    if (account.pets[petName].fitness + 20 > 100) {
      res.status(403).end('Pet is max fitness.');
      return;
    }
    account.pets[petName].fitness += 20;
    account.pets[petName].playCount++;
    account.pets[petName].last_play_update = now;
    handleXPGain(PLAY_BASE_XP, accountId, petName);
    await fs.writeFile('server-side/pets.json', JSON.stringify(accounts));
    res.status(200).end('Fitness increased');
  }
}
