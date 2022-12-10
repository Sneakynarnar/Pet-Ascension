
async function getJson(){
    
    const response = await fetch("http://localhost:8080/api")
    
    
    let pets = await response.json()
    return pets
}
let pets = await getJson()
const petList = document.querySelector("#petlist")
for (const [name, attr] of Object.entries(pets)){
    console.log(name)

    let listNode = document.createElement("li")
    
    let link = document.createElement("a")
    
    link.href="http://localhost:8080/pets/" + name.toLowerCase()
    link.innerText = name
    listNode.append(link)
    petList.append(listNode)
}