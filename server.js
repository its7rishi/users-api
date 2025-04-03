const express = require("express")
const path = require("path")
const cors = require("cors")
const dotenv = require("dotenv").config()
const bodyParser = require("body-parser")
const routes = require("./routes/routes")

const app = express()
const PORT = process.env.PORT || 6000

// Middlewares
app.use(cors())
app.use(express.json())
app.use(express.urlencoded())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(routes)

app.route("/", routes)

app.listen(PORT, () => console.log(`Server is listening on port: ${PORT}`))
