// load environment variables from .env (like mongodb uri, nasa api key, port, etc.)
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");

const apodRoutes = require("./routes/apodRoutes");

const app = express();

// connect to mongodb using the uri from .env
// if this fails, the rest of the app can still start, but the db features won't work
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("connected to mongodb");
  })
  .catch((err) => {
    console.error("error connecting to mongodb:", err);
  });

// tell express that we're using ejs templates and where to find them
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// let express read form data from the browser (like the date input)
// also serve static files (css, images, etc.) from the public folder
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// simple home route that just renders the landing page
app.get("/", (req, res) => {
  res.render("index");
});

// all apod-related routes live in a separate router under /apod
// keeps this file clean and lets apodRoutes handle the nasa logic
app.use("/apod", apodRoutes);

// pick up the port from .env if it exists, otherwise default to 3000
const port = process.env.PORT || 3000;

// start the server and log which port we're using
app.listen(port, () => {
  console.log(`server listening on port ${port}`);
});
