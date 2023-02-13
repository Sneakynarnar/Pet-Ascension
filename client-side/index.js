
const inputBox = document.querySelector("#petname");
const submit = document.querySelector("#postcreatereq");
const invalidText = document.querySelector("#invalidText");
let selectedAnimal = null
function inputHandler(e) {


  const name = inputBox.value;
  const allowedCharacters = "qwertyuiopasdfghjklzxcvbnm1234567890";
  let invalid = false;
  for (const char of name) {
    if (!allowedCharacters.includes(char)) {
      inputBox.classList.add("invalid");
      invalid = true;
      submit.disabled = true;
      invalidText.textContent = "Only lower case letters and numbers are allowed.";
      break;
    }
  }
  if (!invalid && inputBox.classList.contains("invalid")) {
    inputBox.classList.remove("invalid");
    submit.disabled = false;
    invalidText.textContent = "";
  }
}

async function createPetRequest(){
  if (selectedAnimal === null){
    invalidText.textContent = "You have not selected an animal type!"
    return
  } else {
    invalidText.textContent= ""
  }
  const petJson = {
    name: inputBox.value,
    animaltype: selectedAnimal,
    animalcolors: null,
  }
  console.log(petJson);
  const response = await fetch("/pets", {
    method: "POST",
    headers: {"Content-Type": "applications/json"},
    body: JSON.stringify(petJson)
  })
  if (!response.ok){
    console.log('Message gonna uh lol');
  }
}


async function selectAnimal(e){
  document.querySelector("#dog").classList.remove("selected")
  document.querySelector("#cat").classList.remove("selected")
  document.querySelector("#bunny").classList.remove("selected")
  
  e.target.classList.add("selected")
  console.log(e.target.id)
  
  selectedAnimal=e.target.id



}
function main() {
  document.querySelector("#petname").addEventListener("input", inputHandler);
  console.log(document.querySelector("#dog")
  )
  
  document.querySelector("#dog").addEventListener("click", selectAnimal)
  document.querySelector("#cat").addEventListener("click", selectAnimal)
  document.querySelector("#bunny").addEventListener("click", selectAnimal)
  
  submit.addEventListener("click", createPetRequest)
  console.log("Got to main!");
}

window.addEventListener("load", main);
