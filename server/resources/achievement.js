const Boom = require('boom')
const slug = require('slug')
const server = require('../').hapi
const log = require('../helpers/logger')
const fieldsParser = require('../helpers/fieldsParser')
const Achievement = require('../db/achievement')
const AchievementKind = require('../db/achievementKind')

server.method('achievement.create', create, {})
server.method('achievement.update', update, {})
server.method('achievement.updateMulti', updateMulti, {})
server.method('achievement.get', get, {})
server.method('achievement.getByUser', getByUser, {})
server.method('achievement.removeAllFromUser', removeAllFromUser, {})
server.method('achievement.list', list, {})
server.method('achievement.remove', remove, {})
server.method('achievement.addUser', addUser, {})
server.method('achievement.addMultiUsers', addMultiUsers, {})
server.method('achievement.addMultiUsersBySession', addMultiUsersBySession, {})
server.method('achievement.addUserToStandAchievement', addUserToStandAchievement, {})
server.method('achievement.addCV', addCV, {})
server.method('achievement.getPointsForUser', getPointsForUser, {})
server.method('achievement.removeCV', removeCV, {})
server.method('achievement.getActiveAchievements', getActiveAchievements, {})
server.method('achievement.generateCodeSession', generateCodeSession, {})
server.method('achievement.getActiveAchievementsCode', getActiveAchievementsCode, {})
server.method('achievement.getSpeedDatePointsForUser', getSpeedDatePointsForUser, {})
server.method('achievement.addUserToSpeedDateAchievement', addUserToSpeedDateAchievement, {})
server.method('achievement.checkUserStandDay', checkUserStandDay, {})
server.method('achievement.createSecret', createSecret, {})
server.method('achievement.addUserToSecret', addUserToSecret, {})
server.method('achievement.getAchievementBySession', getAchievementBySession, {})

async function create (achievement) {
  achievement.id = achievement.id || slug(achievement.name)

  achievement.updated = achievement.created = Date.now()

  return Achievement.create(achievement)

}

async function update (filter, achievement) {
  if (typeof filter === 'string') {
    filter = { id: filter }
  }

  achievement.updated = Date.now()

  return Achievement.findOneAndUpdate(filter, achievement)
}

async function updateMulti (filter, achievement) {
  if (typeof filter === 'string') {
    filter = { id: filter }
  }

  achievement.updated = Date.now()

  return Achievement.updateMany(filter, achievement)
}

async function get (filter) {
  // log.debug({id: id}, 'getting achievement')

  if (typeof filter === 'string') {
    filter = { id: filter }
  }

  return Achievement.findOne(filter)
}

async function getByUser (filter, cb) {
  // log.debug({id: id}, 'getting achievement')
  const now = new Date()

  filter = {
    users: { $in: [filter] },
    'validity.from': { $lte: now },
    'validity.to': { $gte: now }
  }

  return Achievement.find(filter)
}

async function removeAllFromUser (userId, cb) {
  return Achievement.updateMany({ users: userId }, { $pull: { users: userId } })

}

async function list (query, cb) {
  const filter = {}
  const fields = fieldsParser(query.fields)
  const options = {
    skip: query.skip,
    limit: query.limit,
    sort: fieldsParser(query.sort)
  }

  return Achievement.find(filter, fields, options)
}

async function remove (id) {
  return Achievement.findOneAndRemove({ id: id }) 
}

// 500, 404
async function addCV (userId) {
  const achievementKind = 'cv'
  const now = new Date()

  const changes = {
    $addToSet: {
      users: userId
    }
  }

  return Achievement.findOneAndUpdate({
    kind: achievementKind,
    'validity.from': { $lte: now },
    'validity.to': { $gte: now }
  }, changes)
}

// 500, 404
async function removeCV (userId) {
  const achievementKind = 'cv'
  const now = new Date()

  const changes = {
    $pull: {
      users: userId
    }
  }

  return Achievement.findOneAndUpdate({
    kind: achievementKind,
    'validity.from': { $lte: now },
    'validity.to': { $gte: now }
  }, changes)
}

//500, 404
async function addUser (achievementId, userId, cb) {
  if (!achievementId || !userId) {
    log.error({ userId: userId, achievementId: achievementId }, 'missing arguments on addUser')
    return Boom.badData()
  }
  const changes = {
    $addToSet: {
      users: userId
    }
  }

  const now = new Date()

  return Achievement.findOneAndUpdate({
    id: achievementId,
    'validity.from': { $lte: now },
    'validity.to': { $gte: now }
  }, changes)
}

function getPointsForUser (activeAchievements, userId) {
  const result = { achievements: [], points: 0 }

  // list unique users at their points
  result.achievements = activeAchievements.filter((achievement) => {
    return achievement.users.indexOf(userId) !== -1 && achievement.kind !== 'speedDate'
  })

  // fill the points
  result.achievements.forEach(achv => {
    if (achv.kind !== 'speedDate') {
      result.points += achv.value
    } else {
      result.points += getSpeedDatePoints(achv, userId)
    }
  })

  return result
}

async function getSpeedDatePointsForUser (userId) {
  
  const filter = {
    kind: 'speedDate'
  }

  return Achievement.find(filter)
}

function userFrequence (achievement, userId) {
  let count = 0
  achievement.users.forEach(u => {
    if (u === userId) {
      count++
    }
  })

  return count > 3 ? 3 : count
}

function getSpeedDatePoints (achievement, userId) {
  let count = 0
  let points = 0
  achievement.users.forEach(u => {
    if (u === userId) {
      points += count >= 3 ? 0 : achievement.value / Math.pow(2, count++)
    }
  })

  return points
}

//500
async function addMultiUsers (achievementId, usersId) {
  if (!usersId) {
    log.error('tried to add multiple users to achievement but no users where given')
    return Boom.badData()
  }

  const changes = {
    $addToSet: {
      users: { $each: usersId }
    }
  }

  const now = new Date()

  return Achievement.findOneAndUpdate({
    id: achievementId,
    'validity.from': { $lte: now },
    'validity.to': { $gte: now }
  }, changes)
}

//TODO:
function addMultiUsersBySession (sessionId, usersId, credentials, code, unregisteredUsersNumber, cb) {
  if (!usersId) {
    log.error('tried to add multiple users to achievement but no users where given')
    return cb()
  }

  const changes = {
    $addToSet: {
      users: { $each: usersId }
    },
    $inc: {
      unregisteredUsers: unregisteredUsersNumber
    }
  }

  const now = new Date()

  if (credentials.scope !== 'user') {
    Achievement.findOneAndUpdate({
      session: sessionId,
      'validity.from': { $lte: now },
      'validity.to': { $gte: now }
    }, changes, (err, achievement) => {
      if (err) {
        log.error({ err: err, sessionId: sessionId }, 'error adding user to achievement')
        return cb(Boom.internal())
      }

      if (achievement === null) {
        log.error({ sessionId: sessionId }, 'error trying to add multiple users to not valid achievement in session')
        return cb(new Error('error trying to add multiple users to not valid achievement in session'), null)
      }

      cb(null, achievement.toObject({ getters: true }))
    })
  } else { // Self check in
    if (usersId.length === 1 && usersId[0] === credentials.user.id) {
      Achievement.findOne({
        session: sessionId,
        'validity.from': { $lte: now },
        'validity.to': { $gte: now },
        'code.created': {$lte: now},
        'code.expiration': {$gte: now},
        'code.code': code
      }, (err, achievement) => {
        if (err) {
          log.error({ err: err, sessionId: sessionId }, 'error adding user to achievement')
          return cb(Boom.internal())
        }

        if (achievement === null) {
          log.error({ sessionId: sessionId }, 'error trying to add user to not valid achievement in session')
          return cb(Boom.notFound('error trying to add user to not valid achievement in session'), null)
        }

/** |===========================================================================================================|
 *  |  UGLY FIX: DO NOT KEEP THIS FOR LONGER THAN NECESSARY.                                                    |
 *  |  Currently, 2 workshops are concurrent iff their codes are concurrent                                     |
 *  |  This solution requires human coordination and is ill advised.                                            |
 *  |                                                                                                           |
 *  |  A good solution (at time of writing is it too late to implement this solution as an event is ongoing)    |
 *  |  is storing more session information on session-related achievements.                                     |
 *  |                                                                                                           |
 *  |  Information that is accessed together should be kept together - Lauren Schaefer 2021                     |
 *  |===========================================================================================================| */
        if (achievement.kind === AchievementKind.WORKSHOP) {
          const query = {
            $or: [
              {
                $and: [
                  {'code.created': {$gte: new Date(achievement.code.created)}},
                  {'code.created': {$lte: new Date(achievement.code.expiration)}}
                ]
              },
              {
                $and: [
                  {'code.expiration': {$gte: new Date(achievement.code.created)}},
                  {'code.expiration': {$lte: new Date(achievement.code.expiration)}}
                ]
              }
            ],
            users: usersId[0],
            id: {$ne: achievement.id}
          }

          Achievement.count(query, (err, ct) => {
            if (err) {
              log.error({ err: err, sessionId: sessionId }, 'error adding user to achievement')
              return cb(Boom.internal())
            }

            if (ct > 0) {
              const changes = {
                $pull: {users: usersId[0]}
              }

              log.warn({ user: usersId[0] }, 'User breaking the rules')

              Achievement.update(query, changes, (err, ach) => {
                if (err) {
                  log.error({ err: err, sessionId: sessionId }, 'error adding user to achievement')
                  return cb(Boom.internal())
                }

                log.error({id: usersId[0]}, 'user tried to check in to concurrent workshops')
                return cb(Boom.forbidden('user tried to check in to concurrent workshops'))
              })
            } else {
              Achievement.findOneAndUpdate({
                session: sessionId,
                'validity.from': { $lte: now },
                'validity.to': { $gte: now },
                'code.created': {$lte: now},
                'code.expiration': {$gte: now},
                'code.code': code
              }, changes, (err, achievement) => {
                if (err) {
                  log.error({ err: err, sessionId: sessionId }, 'error adding user to achievement')
                  return cb(Boom.internal())
                }

                if (achievement === null) {
                  log.error({ sessionId: sessionId }, 'error trying to add user to not valid achievement in session')
                  return cb(Boom.notFound('error trying to add user to not valid achievement in session'), null)
                }

                return cb(null, achievement.toObject({ getters: true }))
              })
            }
          })
        } else {
          Achievement.findOneAndUpdate({
            session: sessionId,
            'validity.from': { $lte: now },
            'validity.to': { $gte: now },
            'code.created': {$lte: now},
            'code.expiration': {$gte: now},
            'code.code': code
          }, changes, (err, achievement) => {
            if (err) {
              log.error({ err: err, sessionId: sessionId }, 'error adding user to achievement')
              return cb(Boom.internal())
            }

            if (achievement === null) {
              log.error({ sessionId: sessionId }, 'error trying to add user to not valid achievement in session')
              return cb(Boom.notFound('error trying to add user to not valid achievement in session'), null)
            }

            cb(null, achievement.toObject({ getters: true }))
          })
        }
      })
    } else {
      return cb(Boom.badRequest('invalid payload for user self sign'), null)
    }
  }
}
//TODO:
function checkUserStandDay (userId, cb) {
  if (!userId) {
    log.error('tried to user to company achievement but no user was given')
    return cb()
  }
  const now = new Date()

  const filterA = {
    'kind': AchievementKind.STANDDAY,

    'validity.from': { $lte: now },
    'validity.to': { $gte: now }
  }

  const filterB = {
    'kind': AchievementKind.STAND,

    'validity.from': { $lte: now },
    'validity.to': { $gte: now }
  }

  Achievement.findOne(filterA, (err, achievement) => {
    if (err) {
      log.error({ err: err, userId: userId }, 'error checking user for stand day achievement')
      return cb(Boom.internal())
    }

    if (achievement === null) {
      // No achievement of this kind
      return cb()
    }

    if (achievement.users && achievement.users.includes(userId)) { // User already has achievement
      return cb()
    }

    Achievement.find(filterB, (err, achievements) => { // Else, we check if condition is true
      if (err) {
        log.error({ err: err, userId: userId }, 'error checking user for stand day achievement')
        return cb(Boom.internal())
      }

      if (achievements === null) {
        log.error({ userId: userId }, 'error checking user for stand day achievement')
        return cb(new Error('error checking user for stand day achievement'), null)
      }

      if (achievements.length === 0) {
        return cb()
      }

      let done = true
      achievements.forEach(ach => {
        if (!ach.users.includes(userId)) {
          done = false
        }
      })

      if (done) {
        const update = {
          $addToSet: {
            users: userId
          }
        }
        Achievement.findOneAndUpdate(filterA, update, (err, achievement) => {
          if (err) {
            log.error({ err: err, userId: userId }, 'error adding user to stand day achievement')
            return cb(Boom.internal())
          }

          if (achievement === null) {
            log.error({ userId: userId }, 'error trying to add user to not valid stand day achievement')
            return cb(new Error('error trying to add user to not valid stand day achievement'), null)
          }

          cb(null, achievement.toObject({ getters: true }))
        })
      } else {
        return cb()
      }
    })
  })
}

//500, 404
async function addUserToStandAchievement (companyId, userId, cb) {
  if (!userId) {
    log.error('tried to user to company achievement but no user was given')
    return Boom.badData()
  }

  const changes = {
    $addToSet: {
      users: userId
    }
  }

  const now = new Date()

  return Achievement.findOneAndUpdate({
    id: { $regex: `stand-${companyId}-` },
    'kind': 'stand',
    'validity.from': { $lte: now },
    'validity.to': { $gte: now }
  }, changes)
}


//500, 404
async function addUserToSpeedDateAchievement (companyId, userId, hhs) {
  if (!userId) {
    log.error('tried to user to company achievement but no user was given')
    return Boom.badData()
  }

  const changes = {
    $push: {
      users: hhs.length > 0 ? { $each: Array(3).fill(userId) } : userId
    }
  }

  const now = new Date()

  return Achievement.findOneAndUpdate({
    id: { $regex: `speedDate-${companyId}-` },
    'kind': 'speedDate',
    'validity.from': { $lte: now },
    'validity.to': { $gte: now }
  }, changes)
}

// _date is a string, converted to Date inside this function
async function getActiveAchievements (query, cb) {
  var date
  cb = cb || query

  if (query.date === undefined) {
    date = new Date() // now
  } else {
    date = new Date(query.date)
    if (isNaN(date.getTime())) {
      log.error({ query: query.date }, 'invalid date given on query to get active achievements')
      return cb(Boom.notAcceptable('invalid date given in query'))
    }
  }

  return Achievement.find({
    'validity.from': { $lte: date },
    'validity.to': { $gte: date }
  })
}

async function getActiveAchievementsCode (query) {
  var start, end
  cb = cb || query

  if (query.start === undefined) {
    start = new Date() // now
  } else {
    start = new Date(query.start)
    if (isNaN(start.getTime())) {
      log.error({ query: query.start }, 'invalid start date given on query to get active achievements')
      return Boom.notAcceptable('invalid start date given in query')
    }
  }
  if (query.end === undefined) {
    end = new Date() // now
  } else {
    end = new Date(query.end)
    if (isNaN(end.getTime())) {
      log.error({ query: query.end }, 'invalid end date given on query to get active achievements')
      return Boom.notAcceptable('invalid end date given in query')
    }
  }

  if (end < start) {
    log.error({start: start, end: end}, 'end date is before start date')
    return Boom.notAcceptable('invalid end date given in query')
  }

  const filter = {
    'validity.from': { $gte: start },
    'validity.to': { $lte: end }
  }

  if (query.kind) {
    filter.kind = query.kind
  }

  return Achievement.find(filter)
}

//500, 404
async function generateCodeSession (sessionId, expiration) {
  if (!expiration) {
    log.error('No duration was given')
    return Boom.badData()
  }

  let created = new Date()
  let expires = new Date(expiration)
  if (created >= expires) {
    log.error({expires: expires}, 'expiration date is in the past')
    return Boom.badData('expiration date is in the past')
  }

  let code = randomString(12)

  const changes = {
    $set: {
      code: {
        created: created,
        expiration: expires,
        code: code
      }
    }
  }

  return Achievement.findOneAndUpdate({
    session: sessionId,
    'validity.to': { $gte: created }
  }, changes)
}

function randomString (size) {
  var text = ''
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

  for (var i = 0; i < size; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }

  return text
}

async function createSecret (payload, cb) {
  const options = {
    kind: AchievementKind.SECRET,
    id: new RegExp(payload.event)
  }

  return Achievement.find(options)
}

async function addUserToSecret (id, code, cb) {
  if (!id) {
    log.error('tried to redeem secret but no user was given')
    return Boom.boomify()
  }

  const now = new Date()

  const changes = {
    $addToSet: {
      users: id
    }
  }

  const query = {
    kind: AchievementKind.SECRET,
    'validity.from': { $lte: now },
    'validity.to': { $gte: now },
    'code.created': { $lte: now },
    'code.expiration': { $gte: now },
    'code.code': code
  }

  return Achievement.findOneAndUpdate(query, changes)
}

async function getAchievementBySession (id) {
  let filter = { session: id }

  return Achievement.findOne(filter)
}
