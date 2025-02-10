const mongoose = require('mongoose')

const schema = new mongoose.Schema({
  id: { type: String, unique: true },
  name: String,
  img: String,
  role: { type: String, default: 'user' },
  mail: { type: String, unique: true, sparse: true },
  shareLinks: {type: Boolean, default: false},
  bearer: [{
    token: { type: String, unique: true, sparse: true },
    refreshToken: { type: String, unique: true, sparse: true },
    ttl: Number,
    date: Date
  }],
  signatures: [{
    day: String,
    edition: String,
    redeemed: { type: Boolean, default: false },
    signatures: [{
      companyId: String,
      date: Date
    }]
  }],
  linkShared: {
    type:[{
      edition: String,
      links:{
        type: [String],
        default: []
      }
    }],
    default: []
  },
  company: [{
    edition: String,
    company: String
  }],
  facebook: {
    id: String
  },
  linkedin: {
    id: String
  },
  google: {
    id: String
  },
  fenix: {
    id: String
  },
  // Profile information
  title: String,
  nationality: String,
  skills: [String],
  interestedIn: [String],
  lookingFor: [String],
  academicInformation: [{
    _id: false,
    school: String,
    degree: String,
    field: String,
    grade: String,
    start: Date,
    end: Date
  }],
  contacts: {
    _id: false,
    linkedin: String,
    email: String,
    github: String
  },
  registered: Date,
  updated: Date
})

module.exports = mongoose.model('User', schema)
