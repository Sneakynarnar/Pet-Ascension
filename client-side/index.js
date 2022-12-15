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

function animalEmphasis(e){
  console.log(document.querySelector("#dog").classList);
  
  document.querySelector("#dog").classList.add("hovered")

}
function animalDisemphasis(e){

  document.querySelector("#dog").classList.remove("hovered")
}
function main() {
  document.querySelector("#petname").addEventListener("input", inputHandler);
  document.querySelector("#dog").addEventListener("mouseover", animalEmphasis)
  document.querySelector("#dog").addEventListener("mouseout", animalDisemphasis)
  console.log("Got to main!");
}

window.addEventListener("load", main);
