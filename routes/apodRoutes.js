// bring in express so we can create routes
const express = require("express");

// axios will let us call the nasa api
const axios = require("axios");

// mongoose model for storing favorite apods in mongodb
const Apod = require("../models/Apod");

// create a router so we can keep all /apod routes in one place
const router = express.Router();

/* helper: take a date in "yyyy-mm-dd" format and turn it into "mm/dd/yyyy"
   this keeps things looking nice in the ui without messing with the original value */
function formatForDisplay(dateString) {
  if (!dateString) return "";
  const parts = dateString.split("-");
  if (parts.length !== 3) return dateString;
  const [year, month, day] = parts;
  return `${month}/${day}/${year}`;
}

/* helper: call the nasa apod api for a given date.
   if dateString is missing, nasa just returns today’s picture by default. */
async function fetchApodForDate(dateString) {
  const apiKey = process.env.NASA_API_KEY;
  const baseUrl = "https://api.nasa.gov/planetary/apod";

  const params = {
    api_key: apiKey,
  };

  // if the user picked a date, ask nasa for that specific day
  if (dateString) {
    params.date = dateString; // yyyy-mm-dd
  }

  const response = await axios.get(baseUrl, { params });
  return response.data;
}

/* GET /apod
   this is the main apod page.
   we show:
   - the date picker
   - the list of favorites
   - no current picture yet (apod = null) */
router.get("/", async (req, res) => {
  try {
    // load favorites from mongodb, newest dates first
    const favorites = await Apod.find().sort({ date: -1 });

    // render the apod view with no selected picture yet
    res.render("apod", {
      apod: null,
      favorites,
    });
  } catch (err) {
    console.error("error loading favorites:", err);
    res.status(500).send("server error");
  }
});

/* POST /apod/fetch
   this route runs when the user submits the form with a date.
   flow:
   - read the selected date from the form
   - call nasa’s api for that date
   - format the data into a shape our template likes
   - render the same page but now with the picture of the day */
router.post("/fetch", async (req, res) => {
  const selectedDate = req.body.date; // yyyy-mm-dd from the date input

  try {
    // get the apod data from nasa for that specific day
    const apodData = await fetchApodForDate(selectedDate);

    // also pull favorites again so the page has everything it needs
    const favorites = await Apod.find().sort({ date: -1 });

    // build a clean apod object for the template
    const apod = {
      date: apodData.date, // original yyyy-mm-dd (good for db)
      displayDate: formatForDisplay(apodData.date), // mm/dd/yyyy just for the ui
      title: apodData.title,
      explanation: apodData.explanation,
      mediaType: apodData.media_type,
      imageUrl: apodData.url, // can be an image url or video url
      hdImageUrl: apodData.hdurl || "", // sometimes hdurl is missing, so default to empty string
    };

    // re-render the same page with the selected picture and favorites list
    res.render("apod", {
      apod,
      favorites,
    });
  } catch (err) {
    console.error("error fetching apod:", err);
    res.status(500).send("error fetching nasa data");
  }
});

/* POST /apod/save
   this route saves the currently viewed apod into mongodb.
   the form in the template sends all the fields we need in req.body. */
router.post("/save", async (req, res) => {
  const { date, title, explanation, mediaType, imageUrl, hdImageUrl } =
    req.body;

  try {
    // we don’t want to save the exact same date twice, so we check first
    const existing = await Apod.findOne({ date });
    if (!existing) {
      await Apod.create({
        date,
        title,
        explanation,
        mediaType,
        imageUrl,
        hdImageUrl,
      });
    }

    // after saving (or skipping a duplicate), go back to the main apod page
    res.redirect("/apod");
  } catch (err) {
    console.error("error saving apod:", err);
    res.status(500).send("error saving favorite");
  }
});

/* POST /apod/delete/:id
   this route deletes a favorite from mongodb by its id.
   the delete button in the favorites list posts here. */
router.post("/delete/:id", async (req, res) => {
  try {
    await Apod.findByIdAndDelete(req.params.id);
    res.redirect("/apod");
  } catch (err) {
    console.error("error deleting favorite:", err);
    res.status(500).send("error deleting favorite");
  }
});

// export the router so server.js can mount it under /apod
module.exports = router;
