var mongoose = require('mongoose');

var schema = new mongoose.Schema({
  id: {type: String, unique: true},
  // event: String,
  // category: String,
  session: String,
  name: String,
  description: String,
  instructions: String,
  img: String,
  value: Number,
  users: [String],
  created: Date,
  updated: Date
});

var Achievement = module.exports = mongoose.model('Achievement', schema);