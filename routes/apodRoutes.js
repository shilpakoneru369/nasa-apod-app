const express = require('express');
const axios = require('axios');
const Apod = require('../models/Apod');

const router = express.Router();

// helper to call nasa apod api
async function fetchApodForDate(dateString) {
  const apiKey = process.env.NASA_API_KEY;
  const baseUrl = 'https://api.nasa.gov/planetary/apod';

  const params = {
    api_key: apiKey
  };

  if (dateString) {
    params.date = dateString; // yyyy-mm-dd
  }

  const response = await axios.get(baseUrl, { params });
  return response.data;
}

// GET /apod
// shows the form + favorites, no picture selected yet
router.get('/', async (req, res) => {
  try {
    const favorites = await Apod.find().sort({ date: -1 });
    res.render('apod', {
      apod: null,
      favorites
    });
  } catch (err) {
    console.error('error loading favorites:', err);
    res.status(500).send('server error');
  }
});

// POST /apod/fetch
// user submits a date, we fetch that date's apod
router.post('/fetch', async (req, res) => {
  const selectedDate = req.body.date; // yyyy-mm-dd

  try {
    const apodData = await fetchApodForDate(selectedDate);
    const favorites = await Apod.find().sort({ date: -1 });

    const apod = {
      date: apodData.date,
      title: apodData.title,
      explanation: apodData.explanation,
      mediaType: apodData.media_type,
      imageUrl: apodData.url, // can be image or video url
      hdImageUrl: apodData.hdurl || ''
    };

    res.render('apod', {
      apod,
      favorites
    });
  } catch (err) {
    console.error('error fetching apod:', err);
    res.status(500).send('error fetching nasa data');
  }
});

// POST /apod/save
// save the currently viewed picture to favorites
router.post('/save', async (req, res) => {
  const { date, title, explanation, mediaType, imageUrl, hdImageUrl } = req.body;

  try {
    // avoid duplicates for the same date
    const existing = await Apod.findOne({ date });
    if (!existing) {
      await Apod.create({
        date,
        title,
        explanation,
        mediaType,
        imageUrl,
        hdImageUrl
      });
    }

    res.redirect('/apod');
  } catch (err) {
    console.error('error saving apod:', err);
    res.status(500).send('error saving favorite');
  }
});

// POST /apod/delete/:id
// delete a favorite by id
router.post('/delete/:id', async (req, res) => {
  try {
    await Apod.findByIdAndDelete(req.params.id);
    res.redirect('/apod');
  } catch (err) {
    console.error('error deleting favorite:', err);
    res.status(500).send('error deleting favorite');
  }
});

module.exports = router;