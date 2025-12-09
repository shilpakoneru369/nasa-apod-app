const mongoose = require("mongoose");

const apodSchema = new mongoose.Schema({
  date: { type: String, required: true }, // yyyy-mm-dd
  title: String,
  explanation: String,
  mediaType: String,
  imageUrl: String,
  hdImageUrl: String,
  createdAt: { type: Date, default: Date.now },
});

const Apod = mongoose.model("Apod", apodSchema);

module.exports = Apod;
