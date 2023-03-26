
const submit = document.querySelector('#createaccount');
const user = document.querySelector('#username');
const pass = document.querySelector('#password');
const confirm = document.querySelector('#confirm');
const statusText = document.querySelector('#statusText');


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
  submit.addEventListener('click', createAccountRequest);
}

window.addEventListener('load', main);
