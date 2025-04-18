const express = require("express")
const router = express.Router()
const pool = require("../dbConfig.js")
const bcrypt = require("bcrypt")
const dotenv = require("dotenv").config()
const multer = require("multer")
const path = require("path")
const fs = require("fs")
const { v4: uuidv4 } = require("uuid")
const moment = require("moment")

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
  destination: async (req, file, cb) => {
    const userId = req.params.id
    const uploadDir = path.join(__dirname, "../uploads", userId, "images")

    try {
      // Check if user exists
      const checkResult = await pool.query(
        "SELECT * FROM users WHERE user_id = $1",
        [userId]
      )

      if (checkResult.rows.length > 0) {
        // Create the directory structure if it doesn't exist
        await fs.mkdirSync(uploadDir, { recursive: true })
        cb(null, uploadDir)
      } else {
        return cb(new Error("User Id does not exist"))
      }
    } catch (err) {
      console.error("Error checking valid user id", err)
      cb(err)
    }
  },
  filename: (req, file, cb) => {
    const now = moment().format("YYYYMMDD")
    const fileExtension = path.extname(file.originalname)
    const filename = `${now}-${uuidv4()}${fileExtension}`
    cb(null, filename)
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

router.post(
  "/users/:id/upload-image",
  upload.single("image"),
  async (req, res) => {
    if (!req.file) {
      return res
        .status(400)
        .json({ error: "No file uploaded. Please select a file to upload" })
    }

    // console.log("Uploaded File", req.file)
    const userId = req.params.id
    const filePath = path.join("/uploads", userId, "images", req.file.filename)
    try {
      const result = await pool.query(
        "INSERT INTO images (user_id, image_url) VALUES($1, $2)",
        [userId, filePath]
      )
      res.json({ message: "File uploaded successfully" })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  },
  (error, req, res) => {
    // Error handling middleware for Multer errors
    if (error) {
      console.error("Multer error", error)
      return res.status(400).json({ error: error.message })
    }
    next()
  }
)

module.exports = router
