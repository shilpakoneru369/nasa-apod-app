require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const apodRoutes = require('./routes/apodRoutes');

const app = express();

// connect to mongodb
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('connected to mongodb');
  })
  .catch((err) => {
    console.error('error connecting to mongodb:', err);
  });

// set up ejs view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// allow form data and serve static files
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// home route
app.get('/', (req, res) => {
  res.render('index');
});

// use router for nasa apod routes
app.use('/apod', apodRoutes);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`server listening on port ${port}`);
});