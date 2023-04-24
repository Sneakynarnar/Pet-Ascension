import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
async function init() {
  const db = await open({
    filename: './database.sqlite',
    driver: sqlite3.Database,
    verbose: true,
  });
  return db;
}

const connect = init();

async function initDataBase() {
  const db = await connect;
  console.log('Hello!')
  await db.run('DROP TABLE IF EXISTS Accounts;');
  await db.run('DROP TABLE IF EXISTS Pets;');
  await db.run('CREATE TABLE Accounts (accountId char(25), accountName char(25), NP INT, items char(2000))');
  await db.run('CREATE TABLE Pets (accountId char(25), petName CHAR(12), dateCreated INT, type CHAR(5), cleanliness INT, hunger INT, fitness INT, level INT, XP INT, rank INT, last_updated INT, last_feed_update INT, last_play_update INT, last_clean_update INT, playCount INT, timesPlayed INT, timesCleaned INT, timesFed INT, dead BOOLEAN, diedAt INT, deathReason CHAR(10), colors char(2000))');
}

await initDataBase()