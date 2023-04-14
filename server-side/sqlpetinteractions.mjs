/* eslint-disable no-restricted-syntax */
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import fs from 'fs/promises';
const hour = 1000 * 3600;
const HUNGER_DECAY = 2500;
const CLEANLINESS_DECAY = 2000;
const BASE_NP_RATE = 10000;
const BASE_LEVEL_BOOST = 10;
const FITNESS_DECAY = 3000;
const MIN_SACRIFICE_LEVEL = 15;
const ALLOWED_PLAYS_PER_SESSION = 3;
const PLAY_BASE_XP = 10000;
const PLAY_COOLDOWN_HOURS = 1 / 360;
const FEED_COOLDOWN_HOURS = 1 / 360;
const CLEAN_COOLDOWN_HOURS = 1 / 360;
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

export async function init() {
  const db = await open({
    filename: './database.sqlite',
    driver: sqlite3.Database,
    verbose: true,
  });
  return db;
}

const connect = init();

export async function purchaseItem(accountId, itemName, res) {
  const db = await connect;
  const account = await readAccounts(accountId);
  const item = ITEMS[itemName];
  account.items = JSON.parse(account.items);
  if (account.NP >= item.cost) {
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
  await db.run('UPDATE Accounts SET NP = ?, items = ? WHERE accountId = ?', [account.NP, JSON.stringify(account.items), accountId]);
  res.json(account);
}
export async function createPet(accountId, petName, type) {
  const defaultLastInteract = Date.now() - 36000000; // Last interact by default is set to 5 hours ago
  const now = Date.now();
  const db = await connect;
  const duplicates = await db.get('SELECT * FROM Pets WHERE accountId = ? AND petName = ?', [accountId, petName])
  if (duplicates !== undefined) {
    console.log(`Pet already exists: ${duplicates}`);
    return false;
  }
  await db.run('INSERT INTO Pets VALUES (:accountId, :petName, :dateCreated, :type, :cleanliness, :happiness, :hunger, :level, :XP, :rank, :last_updated, :last_feed_update, :last_play_update, :last_clean_update, :playCount, :dead)', {
    ':accountId': accountId,
    ':petName': petName,
    ':dateCreated': now,
    ':type': type,
    ':cleanliness': 100,
    ':happiness': 100,
    ':hunger': 100,
    ':level': 1,
    ':XP': 0,
    ':rank': 1,
    ':last_feed_update': defaultLastInteract,
    ':last_play_update': defaultLastInteract,
    ':last_clean_update': defaultLastInteract,
    ':playCount': 0,
    ':last_updated': now,
    ':dead': false,
  });
}
export async function readAccounts(accountId = null) {
  const db = await connect;
  console.log(accountId);
  const accounts = accountId === null ? await db.all('SELECT * FROM Accounts') : await db.get('SELECT * FROM Accounts WHERE accountId  = ?', accountId);
  console.log(accounts);

  return accounts;
}
export async function createAccount(accountId) {
  const db = await connect;
  console.log(`Creating account with ID ${accountId}`);
  const account = await db.get('SELECT * FROM Accounts WHERE accountId = ?', accountId);
  if (account !== undefined) {
    console.log(accountId);
    return false;
  }
  db.run('INSERT INTO Accounts VALUES (?,?,?)', [accountId, 100, '{}']);
  return [accountId, 100, '{}'];
}
export function calculateNP(happiness, level, rank, time) {
  const perHour = (BASE_NP_RATE * (1 + (happiness / 100)) * (1 + ((level * BASE_LEVEL_BOOST) / 100))) * rank;

  const earned = perHour * (time / hour);
  console.log(earned);
  return Math.round(earned);
}
export async function handleXPGain(XP, accountId, petName) {
  const db = await connect;
  const pets = await getAccountPets(accountId, petName);
  pets.XP += XP;
  while (pets.XP >= XP_PER_LEVEL) {
    pets.XP -= XP_PER_LEVEL;
    pets.level += 1;
  }
  db.run('UPDATE Pets SET XP = ?, level = ?', pets.XP, pets.level);
}
export async function getAccountPets(accountId, petName = null) {
  const db = await connect;
  const pets = petName === null ? await db.all('SELECT * FROM Pets WHERE accountId = ? ', accountId) : db.get('SELECT * FROM Pets WHERE accountId = ? AND petName = ?', [accountId, petName]);
  return pets;
}
export async function updatePets(accountId) {
  const db = await connect;
  const pets = await getAccountPets(accountId);
  const account = await readAccounts(accountId);
  if (pets === undefined) { return null; }
  let now = Date.now();
  let totalNpEarned = 0;
  for (const pet of pets) {
    pet.hunger -= Math.round(((now - pet.last_feed_update) / hour) * HUNGER_DECAY);
    pet.fitness -= Math.round(((now - pet.last_play_update) / hour) * FITNESS_DECAY);
    pet.cleanliness -= Math.round(((now - pet.last_clean_update) / hour) * CLEANLINESS_DECAY);
    pet.hunger = pet.hunger < 0 ? 0 : pet.hunger;
    pet.cleanliness = pet.cleanliness < 0 ? 0 : pet.cleanliness;
    pet.fitness = pet.fitness < 0 ? 0 : pet.fitness;
    pet.happiness = (pet.hunger + pet.fitness + pet.cleanliness) / 3;
    totalNpEarned += calculateNP(pet.happiness, pet.level, pet.rank, now - pet.last_updated);
    now = Date.now();
    pet.last_updated = now;
    if (pet.hunger <= 0) {
      pet.dead = true;
    }
    db.run('UPDATE Pets SET hunger = ?, fitness = ?, cleanliness = ?, last_updated = ? WHERE accountId = ? AND petName = ?', pet.hunger, pet.fitness, pet.cleanliness, pet.last_updated, accountId, pet.petName);
  }
  account.NP += totalNpEarned;
  db.run('UPDATE Accounts SET NP = ? WHERE accountId = ?', account.NP, accountId);
  return [pets, account.NP];
}

export async function petCare(itemId, accountId, petName, res) {
  const now = Date.now();
  const db = await connect;
  const item = ITEMS[itemId];
  const account = await readAccounts(accountId);
  account.items = JSON.parse(account.items);
  const pet = await getAccountPets(accountId, petName);
  if (item === undefined) {
    res.status(404).send('Cannot find Item.');
    return;
  }
  let cooldown;
  let lastInteract;
  let XP;
  if (item.type === 0) {
    cooldown = CLEAN_COOLDOWN_HOURS;
    lastInteract = now - pet.last_clean_update;
    XP = CLEAN_XP;
  } else {
    cooldown = FEED_COOLDOWN_HOURS;
    lastInteract = now - pet.last_clean_update;
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
      pet.last_clean_update = Date.now();
      pet.cleanliness += item.value;
      db.run('UPDATE Pets SET last_clean_update = ?, cleanliness = ? WHERE accountId = ? ', pet.last_clean_update, pet.cleanliness, accountId);
    } else {
      pet.last_feed_update = Date.now();
      pet.hunger += item.value;
      db.run('UPDATE Pets SET last_feed_update = ?, hunger = ? WHERE accountId = ?', pet.last_feed_update, pet.hunger, accountId);
    }
    handleXPGain(XP, accountId, petName);
    account.items[itemId] -= 1;
    db.run('UPDATE Accounts SET items = ? WHERE accountId = ?', [JSON.stringify(account.items), accountId]);
    res.status(200).send('Stat increased!');
  } else {
    res.status(403, 'Pet refusing to interact');
  }
}
export async function petPlay(accountId, petName, res) {
  const db = await connect;
  const now = Date.now();
  const pet = await getAccountPets(accountId, petName);
  console.log(`Playing with pet: ${JSON.stringify(pet)}`);
  const lastPlayed = now - pet.last_play_update;
  const playCount = pet.playCount;
  console.log(` lastPlayed: ${lastPlayed / 1000 * 60}  seconds ago cooldown: ${PLAY_COOLDOWN_HOURS / 1000 * 60}`);
  if (lastPlayed > hour * PLAY_COOLDOWN_HOURS || playCount <= ALLOWED_PLAYS_PER_SESSION) {
    if (lastPlayed >= hour * PLAY_COOLDOWN_HOURS) { pet.playCount = 0; }
    if (pet.playCount >= ALLOWED_PLAYS_PER_SESSION) {
      res.status(403).end(`Exceeded plays per ${PLAY_COOLDOWN_HOURS} hour(s) `);
      return;
    }
    if (pet.fitness + 20 > 100) {
      res.status(403).end('Pet is max fitness.');
      return;
    }
    pet.fitness += 20;
    pet.playCount++;
    pet.last_play_update = now;
    handleXPGain(PLAY_BASE_XP, accountId, petName);
    db.run('UPDATE Pets SET playCount = ?, fitness = ?, last_play_update = ?', pet.playCount, pet.fitness, pet.last_play_update);
    res.status(200).end('Fitness increased');
  }
}
export async function petSacrifice(accountId, petName) {
  const db = await connect;
  const pet = await getAccountPets(accountId, petName);
  if (pet.level <= MIN_SACRIFICE_LEVEL || pet.dead || pet.rank === 2) {
    return false;
  }
  const qry = await db.get('SELECT items FROM Accounts WHERE accountId = ?', accountId);
  const items = JSON.parse(qry.items);
  if (items.pet_blood === undefined) {
    items.pet_blood = 1;
  } else {
    items.pet_blood += 1;
  }
  await db.run('UPDATE Accounts SET items = ? WHERE accountId = ?', JSON.stringify(items), accountId);
  await db.run('UPDATE Pets SET dead = ?', true);
}
