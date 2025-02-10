const mongoose = require('mongoose')

const schema = new mongoose.Schema({
  from: String,
  to: String,
  edition: String,
  notes: String,
  created: Date,
  updated: Date,
})

// Makes pair unique
schema.index({ 'from': 1, 'to': 1, 'edition': 1}, { 'unique': true })
module.exports = mongoose.model('Connection', schema)
