const express = require("express");
const multer = require("multer");
const path = require("path");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.static("uploads"));
// Serve Bulma CSS from node_modules as /assets/bulma.min.css
app.use('/assets', express.static(path.join(__dirname, 'node_modules', 'bulma', 'css')));

// PostgreSQL Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Multer File Storage Setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

app.get("/", (req, res) => {
  res.send(`
  <!doctype html>
  <html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Registration Form</title>
    <link rel="stylesheet" href="/assets/bulma.min.css">
  </head>
  <body>
    <section class="section">
      <div class="container">
        <h1 class="title">Registration Form</h1>
        <form action="/register" method="post" enctype="multipart/form-data">
          <div class="field">
            <label class="label">Full name</label>
            <div class="control">
              <input class="input" type="text" name="name" placeholder="e.g. Jane Doe" required>
            </div>
          </div>

          <div class="field">
            <label class="label">Phone Number</label>
            <div class="control">
              <input class="input" type="tel" name="phoneNumber" placeholder="e.g. +1234567890" required>
            </div>
          </div>

          <div class="field">
            <label class="label">Email</label>
            <div class="control">
              <input class="input" type="email" name="email" placeholder="e.g. jane@example.com" required>
            </div>
          </div>

          <div class="field">
            <label class="label">Photo</label>
            <div class="control">
              <input class="input" type="file" name="photo" accept="image/*">
            </div>
            <p class="help">Optional. JPG/PNG recommended.</p>
          </div>

          <div class="field">
            <label class="label">Resume (PDF)</label>
            <div class="control">
              <input class="input" type="file" name="resume" accept="application/pdf">
            </div>
            <p class="help">Optional. PDF only.</p>
          </div>

          <div class="field is-grouped">
            <div class="control">
              <button class="button is-link" type="submit">Submit</button>
            </div>
            <div class="control">
              <button class="button is-light" type="reset">Reset</button>
            </div>
          </div>
        </form>
      </div>
    </section>
  </body>
  </html>
  `);
});

// Handle Form Submission
app.post(
  "/register",
  upload.fields([
    { name: "photo", maxCount: 1 },
    { name: "resume", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { name, phoneNumber, email } = req.body;

      const photo = req.files["photo"] ? req.files["photo"][0].filename : null;
      const resume = req.files["resume"] ? req.files["resume"][0].filename : null;

      await pool.query(
        `INSERT INTO registrations (name, phone, email, photo, resume)
         VALUES ($1, $2, $3, $4, $5)`,
        [name, phoneNumber, email, photo, resume]
      );

      res.send("<h3>Registration Successful!</h3>");
    } catch (error) {
      console.error(error);
      res.status(500).send("Error saving data");
    }
  }
);

app.listen(3000, () => console.log("Server running on http://localhost:3000"));

