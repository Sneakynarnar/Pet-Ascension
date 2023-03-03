
const submit = document.querySelector('#createaccount');
const user = document.querySelector('#username');
const pass = document.querySelector('#password');
const confirm = document.querySelector('#confirm')
const invalidText = document.querySelector('')
function confirmPassword(e) {
  if (e.target.value === pass.value){
    submit.disabled = false;
  } else {
    submit.disabled = true;
  }
  
}
async function main() {

  submit.addEventListener("input", confirmPassword)
}

window.addEventListener('load', main);
