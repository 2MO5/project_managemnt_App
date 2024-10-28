// backend/index.js
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database(":memory:");

// Create tables
db.serialize(() => {
  db.run(
    "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, email TEXT, password TEXT)"
  );
  db.run(
    "CREATE TABLE projects (id INTEGER PRIMARY KEY, name TEXT, description TEXT, userId INTEGER, FOREIGN KEY(userId) REFERENCES users(id))"
  );
});

// Register user
app.post("/register", (req, res) => {
  const { name, email, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 8);

  db.run(
    "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
    [name, email, hashedPassword],
    function (err) {
      if (err)
        return res
          .status(500)
          .send("There was a problem registering the user.");

      const token = jwt.sign({ id: this.lastID }, "supersecret", {
        expiresIn: "24h",
      });
      res.status(200).send({ auth: true, token });
    }
  );
});

// User login
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
    if (err) return res.status(500).send("Error on the server.");
    if (!user) return res.status(404).send("No user found.");

    const passwordIsValid = bcrypt.compareSync(password, user.password);
    if (!passwordIsValid)
      return res.status(401).send({ auth: false, token: null });

    const token = jwt.sign({ id: user.id }, "supersecret", {
      expiresIn: "24h",
    });
    res.status(200).send({ auth: true, token });
  });
});

// Middleware to verify token
function verifyToken(req, res, next) {
  const token = req.headers["authorization"];
  if (!token)
    return res.status(403).send({ auth: false, message: "No token provided." });

  jwt.verify(token, "supersecret", (err, decoded) => {
    if (err)
      return res
        .status(500)
        .send({ auth: false, message: "Failed to authenticate token." });
    req.userId = decoded.id;
    next();
  });
}

// Create a project
app.post("/projects", verifyToken, (req, res) => {
  const { name, description } = req.body;
  db.run(
    "INSERT INTO projects (name, description, userId) VALUES (?, ?, ?)",
    [name, description, req.userId],
    function (err) {
      if (err)
        return res
          .status(500)
          .send("There was a problem creating the project.");
      res.status(200).send({ id: this.lastID, name, description });
    }
  );
});

// Get all projects for the logged-in user
app.get("/projects", verifyToken, (req, res) => {
  db.all(
    "SELECT * FROM projects WHERE userId = ?",
    [req.userId],
    (err, projects) => {
      if (err)
        return res
          .status(500)
          .send("There was a problem retrieving the projects.");
      res.status(200).send(projects);
    }
  );
});

// Update a project
app.put("/projects/:id", verifyToken, (req, res) => {
  const { name, description } = req.body;
  db.run(
    "UPDATE projects SET name = ?, description = ? WHERE id = ? AND userId = ?",
    [name, description, req.params.id, req.userId],
    function (err) {
      if (err)
        return res
          .status(500)
          .send("There was a problem updating the project.");
      res.status(200).send({ message: "Project updated successfully." });
    }
  );
});

// Delete a project
app.delete("/projects/:id", verifyToken, (req, res) => {
  db.run(
    "DELETE FROM projects WHERE id = ? AND userId = ?",
    [req.params.id, req.userId],
    function (err) {
      if (err)
        return res
          .status(500)
          .send("There was a problem deleting the project.");
      res.status(200).send({ message: "Project deleted successfully." });
    }
  );
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
