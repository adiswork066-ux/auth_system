const pool = require("../config/db");
const express = require("express");
const router = express.Router();

const jwt = require("jsonwebtoken");

const { registerUser, loginUser } = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

// REGISTER
router.post("/register", registerUser);

// LOGIN
router.post("/login", loginUser);

// 🔐 PROTECTED ROUTE
router.get("/profile", authMiddleware, (req, res) => {
  res.json({
    message: "Protected route accessed",
    user: req.user
  });
});

// 🔁 REFRESH TOKEN
router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: "No refresh token" });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);

    // ✅ CHECK IN NEW TABLE
    const tokenCheck = await pool.query(
      "SELECT * FROM refresh_tokens WHERE user_id = $1 AND token = $2",
      [decoded.id, refreshToken]
    );

    if (tokenCheck.rows.length === 0) {
      return res.status(403).json({ message: "Invalid token" });
    }

    const newAccessToken = jwt.sign(
      { id: decoded.id },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.json({ accessToken: newAccessToken });

  } catch (err) {
    res.status(403).json({ message: "Invalid refresh token" });
  }
});

router.post("/logout", async (req, res) => {
  const { refreshToken } = req.body;

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);

    // ❌ DELETE ONLY THIS DEVICE TOKEN
    const result = await pool.query(
      "DELETE FROM refresh_tokens WHERE user_id = $1 AND token = $2 RETURNING *",
      [decoded.id, refreshToken]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ message: "Invalid token" });
    }

    res.json({ message: "Logged out from this device" });

  } catch (err) {
    res.status(403).json({ message: "Invalid refresh token" });
  }
});

router.post("/logout-all", async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);

    // ❌ DELETE ALL TOKENS FOR USER
    await pool.query(
      "DELETE FROM refresh_tokens WHERE user_id = $1",
      [decoded.id]
    );

    res.json({ message: "Logged out from all devices" });

  } catch (err) {
    res.status(403).json({ message: "Invalid refresh token" });
  }
});

module.exports = router;