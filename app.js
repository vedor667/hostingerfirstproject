const express = require("express");

const app = express();

// Hostinger gives your app a port through an environment variable.
// Locally that variable isn't set, so we fall back to 3000.
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("<h1>Hello from my first Node.js app! 🚀</h1>");
});

app.get("/about", (req, res) => {
  res.json({ name: "My First App", deployedOn: "Hostinger" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
