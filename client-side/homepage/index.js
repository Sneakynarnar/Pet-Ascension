

function inputHandler(e){
    const inputBox = document.querySelector("#petname")
    const name = inputBox.value.toLowerCase()
    let allowedCharacters = "qwertyuiopasdfghjklzxcvbnm-_1234567890"
    console.log(name)
    
    for (char of name){
        if (!!allowedCharacters.includes(char)){
            inputBox.classList.add("invalid")
            
            
        } else if(inputBox.classList.contains("invalid")){
            inputBox.classList.remove("invalid")
        }
        
    }
    

}



function main(){
    document.querySelector("#petname").addEventListener("input", inputHandler)
    console.log("Got to main!")
    
}


window.addEventListener("load", main)
