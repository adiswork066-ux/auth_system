const cors = require("cors");
require("dotenv").config();
const express = require("express");

const app = express();

app.use(express.json());
app.use(cors());

// test route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// routes
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

app.listen(5000, () => {
  console.log("Server running on port 5000");
});