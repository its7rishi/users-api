const express = require("express")
const router = express.Router()
const pool = require("../dbConfig.js")
const bcrypt = require("bcrypt")
const dotenv = require("dotenv").config()
const multer = require("multer")
const path = require("path")
const fs = require("fs")

const salt = parseInt(process.env.SALT) // For bcrypt password hashing

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

// Login User
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    const result = await pool.query("SELECT * FROM users WHERE email=$1", [
      email,
    ])

    if (result.rows.length === 0) {
      res.status(400).json({ error: "User not found" })
    } else {
      const hashedPassword = result.rows[0].password
      const validUser = await bcrypt.compare(password, hashedPassword)
      if (validUser) {
        res.status(200).json({ message: "user logged in successfully" })
      } else {
        res
          .status(400)
          .json({ error: "Authentication failed. Please check your password" })
      }
    }
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Create New User
router.post("/users", async (req, res) => {
  try {
    const { name, email, phone, password } = req.body
    // const salt = 7
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

// File uploads

// Multer Storage Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, `uploads/`)
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname)
  },
})

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      req.fileFilterError = "Only JPG, JPEG, PNG and GIF files are allowed."
      return cb(new Error("Only JPG, JPEG, PNG and GIF files are allowed."))
    }

    cb(null, true)
  },
})

router.post("/users/:id/upload-image", upload.single("image"), (req, res) => {
  console.log("Uploaded File", req.file)
  res.json({ message: "File uploaded successfully" })
})

module.exports = router
