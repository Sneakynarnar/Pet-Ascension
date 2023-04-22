let payload;
const tableBody = document.querySelector('#tableBody');
async function main() {
  const response = await fetch('http://localhost:8080/api/leaderboard');
  const payload = await response.json();
  const leaderboard = JSON.parse(payload);
  console.log(leaderboard);
  let counter = 1;
  let tablerow;
  let tabledata;
  for (const row of leaderboard.rows) {
    tablerow = document.createElement('tr');
    tablerow.id = `place_${counter}`;
    tabledata = document.createElement('td');
    tabledata.textContent = counter;
    tablerow.appendChild(tabledata);
    console.log(row);
    for (const col of Object.values(row)) {
      tabledata = document.createElement('td');
      tabledata.textContent = col;
      tablerow.appendChild(tabledata);
    }
    tableBody.appendChild(tablerow);
    counter++;
  }
}

window.addEventListener('load', main);
