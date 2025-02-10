const Boom = require('@hapi/boom')
const server = require('../').hapi
const Connection = require('../db/connection')

server.method('connection.create', create, {})
server.method('connection.update', update, {})
server.method('connection.list', list, {})
server.method('connection.remove', remove, {})

async function create(connection) {
  const newConnection = {
    ...connection,
    created: new Date(),
    updated: new Date()
  }

  const createdConnection = await Connection.create(newConnection).catch((err) => {
    // Duplicate Key error
    if (err.code === 11000) {
      log.error({ connection: newConnection }, `Connection already exists`)
      throw Boom.conflict(`Connection already exists`)
    }
    log.error({ err, connection: newConnection })
    throw Boom.boomify(err)
  })

  return createdConnection
}

async function update(filter, connection) {
  filter = {
    from: filter.from,
    to: filter.to,
    edition: filter.edition
  }

  connection.updated = Date.now()

  const updatedConnection = await Connection.findOneAndUpdate(filter, connection, { new: true }).catch((err) => {
    log.error({ err, filter }, 'error updating connection')
    throw Boom.boomify(err)
  })

  if (!updatedConnection) {
    log.error({ filter }, 'connection not found')
    throw Boom.notFound()
  }

  return updatedConnection
}

async function list(filter = {}) {
  if (Array.isArray(filter.from)) {
    filter.from = { $in: filter.from }
  }
  if (Array.isArray(filter.to)) {
    filter.to = { $in: filter.to }
  }
  if (Array.isArray(filter.edition)) {
    filter.edition = { $in: filter.edition }
  }

  return Connection.find(filter)
}

async function remove(filter) {
  return Connection.findOneAndRemove(filter)
}
