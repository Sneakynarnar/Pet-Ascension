function inputHandler(e) {
  const inputBox = document.querySelector("#petname");
  const submit = document.querySelector("#postcreatereq");
  const invalidText = document.querySelector("#invalidText");

  const name = inputBox.value;
  let allowedCharacters = "qwertyuiopasdfghjklzxcvbnm1234567890";
  console.log(name);
  let invalid = false;
  for (const char of name) {
    if (!allowedCharacters.includes(char)) {
      inputBox.classList.add("invalid");
      invalid = true;
      submit.disabled = true;
      invalidText.textContent =
        "Only lower case letters and numbers are allowed.";
      break;
    }
  }
  if (!invalid && inputBox.classList.contains("invalid")) {
    inputBox.classList.remove("invalid");
    submit.disabled = false;
    invalidText.textContent = "";
  }
}

function main() {
  document.querySelector("#petname").addEventListener("input", inputHandler);
  console.log("Got to main!");
}

window.addEventListener("load", main);
