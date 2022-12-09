const express = require("express");
const path = require("path");
const fs = require("fs/promises");
const open = require("open");
const app = express();
const PORT = 8080;
let data = {
    hunger: 500,
    level: 2,
    entertainment: 3    
};

//app.use(express.static("./client-side/homepage"));
app.use(express.urlencoded({extended: false}));
app.use("/",express.static(path.join(__dirname, "../client-side")));
//app.use("/pets", express.static(path.join(__dirname, "client-side/pets")))
// app.get("/", (req, res) => {
//     res.sendFile(path.join(path.resolve(__dirname, ".."), "/client-side/homepage/index.html"));
// })


app.post("/createpet", async (req, res) => {
    let data = await fs.readFile("server-side/pets.json");
    let pets = JSON.parse(data);   
    if (pets[req.body.petname] ===undefined){
        pets[req.body.petname.toLowerCase()] = {
                type: req.body.antype,
                cleanliness: 50,
                hunger: 50,
                level: 1,
                rank: 1,
        }
   
        
    fs.writeFile("server-side/pets.json", JSON.stringify(pets));
    res.redirect("http://localhost:8080/pets")

    } else {
        res.send("A pet already exists with that name!");
    }
    

})

app.get("/pets", async (req, res) => {
    res.sendFile(path.join(path.resolve(__dirname, ".."), "/client-side/pets/index.html"));   
    let data = await fs.readFile("server-side/pets.json")
    let pets = JSON.parse(data)   
    let petName = req.baseUrl.slice(5)
    
})

app.get("/pets/:petName", async (req, res) => {
    let data = await fs.readFile("server-side/pets.json")
    let pets = JSON.parse(data)     
    let petName = req.params["petName"]

    
    if (pets[petName] === undefined){
        res.status(404).end("Not found" + JSON.stringify(pets))
        return
    }
    res.send(petName)
})

app.get("/api", async (req, res) => {

    res.set("Content-Type", "application/json");
    let data = await fs.readFile("server-side/pets.json")
    let pets = JSON.parse(data)    
    res.send(JSON.stringify(data));
})

app.listen(PORT, (req, res) => {
    //open("http://localhost:8080")
    console.log(`Listening on port ${PORT}`);
    

    
})
