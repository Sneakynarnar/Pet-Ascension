

let happy = 0;

const text = document.querySelector('#number');
function addToTimer() {
  happy += 15;
}


function decrementTimer() {
  happy = Math.max(0, --happy);
  text.textContent = happy;
}

function main() {
  window.setInterval(decrementTimer, 100);
  const button = document.querySelector('#play');
  button.addEventListener('click', addToTimer);
}

window.addEventListener('load', main);
