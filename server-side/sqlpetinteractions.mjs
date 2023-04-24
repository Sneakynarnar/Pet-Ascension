/* eslint-disable no-restricted-syntax */
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import fs from 'fs/promises';
const hour = 1000 * 3600;
const HUNGER_DECAY = 5;
const CLEANLINESS_DECAY = 5;
const BASE_NP_RATE = 10000;
const BASE_LEVEL_BOOST = 10;
const FITNESS_DECAY = 5;
const BASE_HAPPINESS_POINTS = 20;
const MIN_SACRIFICE_LEVEL = 15;
const ALLOWED_PLAYS_PER_SESSION = 3;
const PLAY_BASE_XP = 100000;
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
export async function createPet(accountId, petName, type, colors, res) {
  const defaultLastInteract = Date.now() - hour * 2;
  const now = Date.now();
  const db = await connect;
  const duplicates = await db.get('SELECT * FROM Pets WHERE accountId = ? AND petName = ?', [accountId, petName]);
  if (duplicates !== undefined) {
    res.status(403).send(`Pet already exists: ${JSON.stringify(duplicates)}`);
    return false;
  }
  if (petName.length < 3) {
    res.status(403).send('Pet name too short.');
    return;
  }
  const allowedCharacters = 'qwertyuiopasdfghjklzxcvbnm1234567890';
  for (const char of petName) {
    if (!allowedCharacters.includes(char)) {
      res.staus(403).send('Invalid pet name.');
      return;
    }
  }
  await db.run('INSERT INTO Pets VALUES (:accountId, :petName, :dateCreated, :type, :cleanliness, :happiness, :hunger, :level, :XP, :rank, :last_updated, :last_feed_update, :last_play_update, :last_clean_update, :playCount, :timesPlayed, :timesCleaned, :timesFed, :dead, :diedAt, :deathReason, :colors)', {
    ':accountId': accountId,
    ':petName': petName,
    ':dateCreated': now,
    ':type': type,
    ':cleanliness': 60,
    ':happiness': 75,
    ':hunger': 10,
    ':level': 1,
    ':XP': 0,
    ':rank': 1,
    ':last_feed_update': defaultLastInteract,
    ':last_play_update': defaultLastInteract,
    ':last_clean_update': defaultLastInteract,
    ':playCount': 0,
    ':timesPlayed': 0,
    ':timesCleaned': 0,
    ':timesFed': 0,
    ':last_updated': now,
    ':dead': false,
    ':diedAt': null,
    ':deathReason': null,
    ':colors': colors,
  });
  res.status(200).send('Pet created!');
}
export async function readAccounts(accountId = null) {
  const db = await connect;
  console.log(accountId);
  const accounts = accountId === null ? await db.all('SELECT * FROM Accounts') : await db.get('SELECT * FROM Accounts WHERE accountId  = ?', accountId);
  console.log(accounts);

  return accounts;
}
export async function getLeaderboard() {
  const db = await connect;
  const petLeaderBoard = await db.all('SELECT petName, level, XP, timesPlayed, timesCleaned, timesFed, rank, accountName FROM Pets JOIN Accounts ON Pets.accountId = Accounts.accountId WHERE Pets.dead = false ORDER BY Pets.level, Pets.XP DESC');
  return JSON.stringify({ rows: petLeaderBoard });
}
export async function createAccount(accountId, accountName) {
  const db = await connect;
  console.log(`Creating account with ID ${accountId}`);
  const account = await db.get('SELECT * FROM Accounts WHERE accountId = ?', accountId);
  if (account !== undefined) {
    console.log(accountId);
    return false;
  }
  db.run('INSERT INTO Accounts VALUES (?,?,?,?)', [accountId, accountName, 100, '{}']);
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
  db.run('UPDATE Pets SET XP = ?, level = ? WHERE accountId = ? AND petName = ?', pets.XP, pets.level, accountId, petName);
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
  if (pets === undefined || account === undefined) { return null; }
  let now = Date.now();
  let totalNpEarned = 0;
  for (const pet of pets) {
    if (pet.dead) { continue; }
    pet.hunger -= Math.round(((now - pet.last_updated) / hour) * HUNGER_DECAY);
    pet.fitness -= Math.round(((now - pet.last_updated) / hour) * FITNESS_DECAY);
    pet.cleanliness -= Math.round(((now - pet.last_updated) / hour) * CLEANLINESS_DECAY);
    pet.hunger = pet.hunger < 0 ? 0 : pet.hunger;
    pet.cleanliness = pet.cleanliness < 0 ? 0 : pet.cleanliness;
    pet.fitness = pet.fitness < 0 ? 0 : pet.fitness;
    pet.happiness = (pet.hunger + pet.fitness + pet.cleanliness) / 3;
    totalNpEarned += calculateNP(pet.happiness, pet.level, pet.rank, now - pet.last_updated);
    now = Date.now();
    pet.last_updated = now;
    if (pet.hunger <= 0) {
      pet.dead = true;
      pet.diedAt = now;
      pet.deathReason = 'starvation';
    } else if (pet.cleanliness && pet.fitness <= 0) {
      pet.dead = true;
      pet.diedAt = now;
      pet.deathReason = 'illness';
    }
    console.log(`last updated ${(now - pet.last_updated) / hour} hours ago`);
    db.run('UPDATE Pets SET hunger = ?, fitness = ?, cleanliness = ?, last_updated = ?, dead = ?, diedAt = ?, deathReason = ? WHERE accountId = ? AND petName = ?', pet.hunger, pet.fitness, pet.cleanliness, pet.last_updated, pet.dead, pet.diedAt, pet.deathReason, accountId, pet.petName);
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
      if (pet.cleanliness >= 100) {
        res.status(403).send('Pet is already completely clean!!');
        return;
      }
      pet.cleanliness = pet.cleanliness + item.value > 100 ? 100 : pet.cleanliness + item.value;
      pet.timesCleaned += 1;
      db.run('UPDATE Pets SET last_clean_update = ?, cleanliness = ?, timesCleaned = ? WHERE accountId = ? AND petName = ?', pet.last_clean_update, pet.cleanliness, pet.timesCleaned, accountId, petName);
    } else {
      if (pet.hunger >= 100) {
        res.status(403).send('Pet is already completely full!!');
        return;
      }
      pet.last_feed_update = Date.now();
      pet.hunger = pet.hunger + item.value > 100 ? 100 : pet.hunger + item.value;
      pet.timesFed += 1;
      db.run('UPDATE Pets SET last_feed_update = ?, hunger = ?, timesFed = ? WHERE accountId = ? AND petName = ?', pet.last_feed_update, pet.hunger, pet.timesFed, accountId, petName);
    }
    handleXPGain(XP, accountId, petName);
    account.items[itemId] -= 1;
    db.run('UPDATE Accounts SET items = ? WHERE accountId = ?', [JSON.stringify(account.items), accountId]);
    res.status(200).send('Stat increased!');
  } else {
    res.status(403, 'Pet refusing to interact');
  }
}

export async function checkPetPlay(accountId, petName, res) {
  const now = Date.now();
  const pet = await getAccountPets(accountId, petName);
  console.log(`Playing with pet: ${JSON.stringify(pet)}`);
  const lastPlayed = now - pet.last_play_update;
  const playCount = pet.playCount;
  console.log(` lastPlayed: ${lastPlayed / 1000 * 60}  seconds ago cooldown: ${PLAY_COOLDOWN_HOURS / 1000 * 60}`);
  if (lastPlayed > hour * PLAY_COOLDOWN_HOURS || playCount <= ALLOWED_PLAYS_PER_SESSION) {
    if (lastPlayed >= hour * PLAY_COOLDOWN_HOURS) { pet.playCount = 0; }
    if (pet.playCount >= ALLOWED_PLAYS_PER_SESSION) {
      res.status(403).send(`Exceeded plays per ${PLAY_COOLDOWN_HOURS} hour(s) `);
      return;
    }
    if (pet.fitness + BASE_HAPPINESS_POINTS > 100) {
      res.status(403).send('Pet is max fitness.');
    }
  }
}
export async function petPlay(accountId, petName, boost, res) {
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
      res.status(403).send(`Exceeded plays per ${PLAY_COOLDOWN_HOURS} hour(s) `);
      return;
    }
    if (pet.fitness + BASE_HAPPINESS_POINTS > 100) {
      res.status(403).send('Pet is max fitness.');
      return;
    }
    console.log(`boost was initially ${boost}`);
    boost = boost >= 10 ? 10 : boost;
    pet.fitness += BASE_HAPPINESS_POINTS * (1 + (boost / 10));
    console.log(`Boost is ${(1 + (boost / 10))} so as per the ${BASE_HAPPINESS_POINTS} base happiness has been increased by ${BASE_HAPPINESS_POINTS * (1 + boost / 10)}`);
    pet.playCount++;
    pet.timesPlayed++;
    pet.last_play_update = now;
    handleXPGain(PLAY_BASE_XP, accountId, petName);
    db.run('UPDATE Pets SET playCount = ?, fitness = ?, last_play_update = ?, timesPlayed = ? WHERE accountId = ? AND petName = ?', pet.playCount, pet.fitness, pet.last_play_update, pet.timesPlayed, accountId, petName);
    res.status(200).end('Fitness increased');
  }
}
export async function petSacrifice(accountId, petName, res) {
  const db = await connect;
  const pet = await getAccountPets(accountId, petName);
  if (pet.level <= MIN_SACRIFICE_LEVEL) {
    res.status(403).send('Pet not high enough leveled to be sacrificed!');
    return;
  } else if (pet.dead) {
    res.status(403).send('Cannot sacrifice pet that is already dead! Jeez, how much did you hate it?');
    return;
  } else if (pet.rank === 2) {
    res.status(403).send('Ascended pets are too cursed to be sacrificed.');
    return;
  }
  const qry = await db.get('SELECT items FROM Accounts WHERE accountId = ?', accountId);
  const items = JSON.parse(qry.items);
  let count;
  if (items.pet_blood === null) {
    items.pet_blood = 0;
    count = 1;
  } else {
    count = Math.floor(pet.level / 5) - 2;
  }
  items.pet_blood += count;
  await db.run('UPDATE Accounts SET items = ? WHERE accountId = ?', JSON.stringify(items), accountId);
  await db.run('UPDATE Pets SET dead = ?, diedAt = ?, deathReason = ? WHERE petName = ? AND accountId = ?', true, Date.now(), 'sacrifice', petName, accountId);
  res.status(200).send(`${count} pet blood recieved from sacrificing ${petName}`);
}

export async function guildPet(accountId, petName, res) {
  const db = await connect;
  const pet = await getAccountPets(accountId, petName);
  pet.level = 16;
  const account = await readAccounts(accountId);
  const items = JSON.parse(account.items);
  if (pet === undefined) {
    res.status(404).send('Pet not found!');
    return false;
  }
  if (pet.level < 15) {
    res.status(403).send('Pet not a high enough level!');
    return false;
  } else if (pet.rank >= 3) {
    res.status(403).send('Pet is max guilded.');
    return false;
  }
  if ((items.pet_blood < 3 && pet.rank === 1) || (items.pet_blood < 6 && pet.rank === 2)) {
    res.status(403).send('Not enough pet blood.');
    return false;
  }
  items.pet_blood = pet.rank === 1 ? items.pet_blood - 3 : items.pet_blood - 6;
  pet.rank += 1;
  res.status(200).send(`Rank increased to ${pet.rank}`);
  await db.run('UPDATE Accounts SET items = ? WHERE accountId = ?', JSON.stringify(items), accountId);
  await db.run('UPDATE Pets SET rank = ? WHERE accountId = ? AND petName = ?', pet.rank, accountId, petName);
}
