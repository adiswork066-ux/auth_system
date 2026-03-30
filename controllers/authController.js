const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const bcrypt = require("bcrypt");

exports.registerUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // save user
    const newUser = await pool.query(
      "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *",
      [email, hashedPassword]
    );

    res.status(201).json({
      message: "User registered",
      user: newUser.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // check user
    const user = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (user.rows.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }

    // compare password
    const validPassword = await bcrypt.compare(
      password,
      user.rows[0].password
    );

    if (!validPassword) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // create token
    const accessToken = jwt.sign(
      { id: user.rows[0].id, email: user.rows[0].email },
      process.env.JWT_SECRET,
      { expiresIn: "15min" }
    );

    const refreshToken = jwt.sign(
      { id: user.rows[0].id, email: user.rows[0].email },
      process.env.REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    await pool.query(
  "INSERT INTO refresh_tokens (user_id, token) VALUES ($1, $2)",
  [user.rows[0].id, refreshToken]
);

    res.json({ accessToken, refreshToken });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};