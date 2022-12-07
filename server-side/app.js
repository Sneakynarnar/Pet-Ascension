const express = require("express")
const path = require("path")
const app = express()
const PORT = 8080
let data = {
    hunger: 500,
    level: 2,
    entertainment: 3    
}

app.use(express.static("./client-side"));

// app.get("/", (req, res) => {
//     res.send("This is a test lol");
// }
// )

// app.get("/api", (req, res) => {

//     res.set("Content-Type", "application/json");
//     res.send(JSON.stringify(data));
// })

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
    
})
