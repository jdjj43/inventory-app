const mongoose = require("mongoose");
require('dotenv').config();

const Schema = mongoose.Schema;
mongoose.connect(process.env.MONGO_URI);

const CategorySchema = new Schema ({
  name: { type: String, required: true},
  description: { type: String, required: true },
})

// Virtual for URL
CategorySchema.virtual('url').get(function () {
  return `/category/${this._id}`;
});

module.exports = mongoose.model("Category", CategorySchema);