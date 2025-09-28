const express = require("express");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

// register
router.post(
  "/register",
  [
    body("email").isEmail().withMessage("Invalid email"),
    body("password").isLength({ min: 8 }).withMessage("Password must be >= 8 chars"),
    body("username").optional().isLength({ min: 3 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password, username } = req.body;
    try {
      if (await User.findOne({ email })) return res.status(409).json({ error: "Email already registered" });
      if (username && (await User.findOne({ username }))) return res.status(409).json({ error: "Username taken" });

      const hash = await bcrypt.hash(password, 10);
      const user = new User({ email, username, passwordHash: hash });
      await user.save();

      const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });
      res.status(201).json({ user: { id: user._id, email: user.email, username: user.username }, token });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// login
router.post(
  "/login",
  [body("email").isEmail(), body("password").exists()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    try {
      const user = await User.findOne({ email });
      if (!user) return res.status(401).json({ error: "Invalid credentials" });

      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return res.status(401).json({ error: "Invalid credentials" });

      const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });
      res.json({ user: { id: user._id, email: user.email, username: user.username }, token });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// me (protected example)
router.get("/me", async (req, res) => {
  const auth = req.headers.authorization || "";
  const token = auth.replace(/^Bearer\s+/, "");
  if (!token) return res.status(401).json({ error: "Missing token" });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "dev_secret");
    const user = await User.findById(payload.id).select("-passwordHash");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user });
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
});

module.exports = router;
