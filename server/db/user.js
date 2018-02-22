const mongoose = require('mongoose')

const schema = new mongoose.Schema({
  id: {type: String, unique: true},
  name: String,
  img: String,
  role: {type: String, default: 'user'},
  mail: {type: String, unique: true, sparse: true},
  bearer: [{
    token: {type: String, unique: true, sparse: true},
    refreshToken: {type: String, unique: true, sparse: true},
    ttl: Number,
    date: Date
  }],
  signatures: [{
    day: String,
    edition: String,
    signatures: [String]
  }],
  company: [{
    edition: String,
    company: String
  }],
  facebook: {
    id: String,
    token: {type: String, unique: true, sparse: true}
  },
  google: {
    id: String,
    img: String,
    token: {type: String, unique: true, sparse: true}
  },
  fenix: {
    id: String,
    token: {type: String, unique: true, sparse: true},
    refreshToken: {type: String, unique: true, sparse: true},
    ttl: Number,
    created: Date
  },
  points: {
    available: Number,
    total: Number
  },
  achievements: [{
    id: String,
    date: Date
  }],
  area: String,
  skills: Array,
  job: {
    startup: Boolean,
    internship: Boolean,
    start: Date
  },
  registered: Date,
  updated: Date
})

module.exports = mongoose.model('User', schema)
