import express from 'express'
import fs from 'fs/promises'
const app = express();
const PORT = 8080;
let data = fs.readFile("server-side/pets.json")

//app.use(express.static("./client-side/homepage"));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use("/",express.static("client-side"));
//app.use("/pets", express.static(path.join(__dirname, "client-side/pets")))
// app.get("/", (req, res) => {
//     res.sendFile(path.join(path.resolve(__dirname, ".."), "/client-side/homepage/index.html"));
// })


async function createPet(req, res){
    let data = await fs.readFile("server-side/pets.json");
    let pets = JSON.parse(data); 
    console.log('hello!');
    
    console.log(req.body);
    if (pets[req.body.name] ===undefined){
        
        
        pets[req.body.name.toLowerCase()] = {
                type: req.body.antype,
                cleanliness: 50,
                hunger: 50,
                level: 1,
                rank: 1,
        }  
    fs.writeFile("server-side/pets.json", JSON.stringify(pets));
    res.redirect("http://localhost:8080/pets");

    } else {
        res.send("A pet already exists with that name!");
    }

}
async function showAllPets(req, res) {
    res.sendFile(path.join(path.resolve(__dirname, ".."), "/client-side/pets/index.html"));   
    let data = await fs.readFile("server-side/pets.json");
    let pets = JSON.parse(data);
    let petName = req.baseUrl.slice(5);
}


async function showSpecificPet(req, res){
    let data = await fs.readFile("server-side/pets.json");
    let pets = JSON.parse(data);
    let petName = req.params["petName"];
    if (pets[petName] === undefined){
        res.status(404).end("Not found");
        return
    }
    res.send(petName);
}

app.post("/pets", express.json, createPet);
app.get("/pets", showAllPets);
app.get("/pets/:petName", showSpecificPet);
app.get("/api", async (req, res) => {

    res.set("Content-Type", "application/json");
    let data = await fs.readFile("server-side/pets.json");
    let pets = JSON.parse(data);
    res.json(pets);
});

app.listen(PORT, (req, res) => {
    console.log(`Listening on port ${PORT}`);    
});
