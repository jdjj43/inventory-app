const mongoose = require("mongoose");
require("dotenv").config();

const Schema = mongoose.Schema;
mongoose.connect(process.env.MONGO_URI);

const ItemSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  categories: [{ type: Schema.Types.ObjectId, ref: "Category" }],
  price: { type: Number, required: true },
  number: { type: Number, required: true },
  imageUrl: { type: String },
});

// Virtual for URL
ItemSchema.virtual("url").get(function () {
  return `/item/${this._id}`;
});

module.exports = mongoose.model("Item", ItemSchema);
