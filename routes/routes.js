const express = require("express")
const router = express.Router()
const dbConfig = require("../dbConfig.js")
const pool = require("../dbConfig.js")
const bcrypt = require("bcrypt")
const dotenv = require("dotenv").config()

// Get All Users
router.get("/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users")
    res.status(200).json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Get single user with id
router.get("/users/:id", async (req, res) => {
  try {
    result = await pool.query(
      `SELECT * FROM users WHERE user_id = ${req.params.id}`
    )
    if (result.rows.length === 0)
      res.status(400).json({ error: "User Not Found" })
    res.status(200).json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Create New User
router.post("/users", async (req, res) => {
  try {
    const { name, email, phone, password } = req.body
    const salt = 7
    let hashedPassword = await bcrypt.hash(password, salt)
    //console.log(hashedPassword)
    result = await pool.query(
      `INSERT INTO users (name, email, phone, password) VALUES($1, $2, $3, $4) RETURNING *`,
      [name, email, phone, hashedPassword]
    )
    res.status(201).json({
      message: "User crated Successfully",
      data: result.rows[0],
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Update Single User By Id
router.put("/users/:id", async (req, res) => {
  try {
    const { id } = req.params
    const { name, email, phone, password } = req.body
    const salt = 7
    const hashedPassword = await bcrypt.hash(password, salt)

    const result = await pool.query(
      "UPDATE users SET name=$1, email=$2, phone=$3, password=$4 WHERE user_id=$5 RETURNING *",
      [name, email, phone, hashedPassword, id]
    )
    console.log("id", id)
    if (result.rows.length === 0) {
      res.status(404).json({ error: "User Not Found" })
    }
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Delete User By Id
router.delete("/users/:id", async (req, res) => {
  try {
    const { id } = req.params

    console.log(id)

    const result = await pool.query(
      "DELETE FROM users WHERE user_id = $1 RETURNING *",
      [id]
    )

    if (result.rows.length === 0)
      res.status(404).json({ error: "User Not Found!" })

    res.json({ message: "User deleted successfully!" })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
