
const fs = require("fs/promises")

const data = fs.readFile("pets.json")
const pets = JSON.parse(data)
const petList = document.querySelector("#petlist")
for (const pet of pets){
    let link = document.createElement("a")
    link.href="http://localhost:8080/pets/" + pet.name
    link.innerText = pet.name
    petList.append(link)
}