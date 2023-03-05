
const submit = document.querySelector('#createaccount');
const user = document.querySelector('#username');
const pass = document.querySelector('#password');
const confirm = document.querySelector('#confirm');
const statusText = document.querySelector('#statusText');
function confirmPassword(e) {
  if (e.target.value === pass.value) {
    submit.disabled = false;
    statusText.textContent = '';
    user.classList.remove('invalid');
  } else {
    user.classList.add('invalid');
    submit.disabled = true;
    statusText.textContent = 'These passwords do not match!!';
  }
}

function checkUsernameValidity(e) {
  const name = e.target.value.toLowerCase();
  const allowedCharacters = 'qwertyuiopasdfghjklzxcvbnm1234567890';
  let invalid = false;
  for (const char of name) {
    if (!allowedCharacters.includes(char)) {
      user.classList.add('invalid');
      statusText.classList.add('faliure');
      invalid = true;
      submit.disabled = true;
      statusText.textContent = 'Only lower case letters and numbers are allowed. In the username';
      break;
    }
  }
  if (!invalid && user.classList.contains('invalid')) {
    user.classList.remove('invalid');
    submit.disabled = false;
    statusText.classList.remove('faliure');
    statusText.textContent = '';
  }
}

async function createAccountRequest() {
  const accountJson = {
    username: user.value,
    password: confirm.value,
  };

  const res = await fetch({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: accountJson,
  });

  if (res.ok) {
    statusText.classList.remove('faliure');
    statusText.classList.add('success');
    statusText.textContent = 'Account created successfully!';
  } else {
    statusText.classList.add('faliure');
    statusText.classList.remove('success');
    statusText.textContent = 'Something went wrong when creating your account. Please try again later.';
  }
}
function main() {
  confirm.addEventListener('input', confirmPassword);
  user.addEventListener('input', checkUsernameValidity);
  submit.addEventListener('click', createAccountRequest);
}

window.addEventListener('load', main);
