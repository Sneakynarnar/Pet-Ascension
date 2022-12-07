const express = require("express")
const path = require("path")
const fs = require("fs/promises")
const open = require("open")
const app = express()
const PORT = 8080
let data = {
    hunger: 500,
    level: 2,
    entertainment: 3    
}

app.use(express.static("./client-side/homepage"));
app.use(express.urlencoded({extended: false}))
app.get("/", (req, res) => {
    res.sendFile(path.join(path.resolve(__dirname, ".."), "/client-side/homepage/index.html"));
    res.sendFile(path.join(path.resolve(__dirname, ".."), "/client-side/homepage/style.css"));
    res.sendFile(path.join(path.resolve(__dirname, ".."), "/client-side/homepage/index.js"));
    }   
)


app.post("/createpet",  async (req, res) =>{
    let data = await fs.readFile("server-side/pets.json")
    pets = JSON.parse(data)
    if (pets[req.body.petname] ===undefined){
        pets[req.body.petname] = {
                type: req.body.antype,
                cleanliness: 50,
                hunger: 50,
                level: 1,
                rank: 1,
        }
        res.set("Content-Type", "application/json");
        res.send(JSON.stringify(pets));

        fs.writeFile("server-side/pets.json", JSON.stringify(pets))
    } else {

        res.send("A pet already exists with that name!")
    }
    

})

// app.get("/api", (req, res) => {

//     res.set("Content-Type", "application/json");
//     res.send(JSON.stringify(data));
// })

app.listen(PORT, (req, res) => {
    
    console.log(`Listening on port ${PORT}`);
   // open("https://localhost:8080")
    
})
