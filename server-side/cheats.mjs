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

function setPetLevel(accountId, petname, level) {

}

function giveItem(accountId, petName, item ) { 
  
}