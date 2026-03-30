const cors = require("cors");
require("dotenv").config();
const express = require("express");

const app = express();

// middleware
app.use(express.json());

app.use(cors({
  origin: "*", // later you can restrict to your frontend URL
}));

// test route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// routes
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

// ✅ IMPORTANT: use dynamic port
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});