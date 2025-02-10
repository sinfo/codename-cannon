const Joi = require('joi')
const render = require('../../views/connection')
const log = require('../../helpers/logger')
const Boom = require('@hapi/boom')

exports = module.exports

exports.createUserConnection = {
  options: {
    tags: ['api', 'connection'],
    auth: {
      strategies: ['default'],
      scope: ['user', 'company', 'team', 'admin']
    },
    validate: {
      payload: Joi.object({
        to: Joi.string().required().description('ID of the user to connect with'),
        notes: Joi.string().allow('').description('Notes about the user connected with')
      })
    }
  },
  handler: async function (request, h) {
    try {
      const edition = await request.server.methods.deck.getLatestEdition()
      const connection = await request.server.methods.connection.create({
        ...request.payload,
        from: request.auth.credentials.user.id,
        edition: edition.id
      })
      return h.response(render(connection))
    } catch (err) {
      log.error({ err: err }, 'error creating connection')
      return Boom.boomify(err)
    }
  }
}

exports.updateUserConnection = {
  options: {
    tags: ['api', 'connection'],
    auth: {
      strategies: ['default'],
      scope: ['user', 'company', 'team', 'admin']
    },
    validate: {
      params: Joi.object({
        userId: Joi.string().required().description('ID of the user connected with'),
      }),
      payload: Joi.object({
        notes: Joi.string().allow('').description('Notes about the user connected with')
      })
    }
  },
  handler: async function (request, h) {
    try {
      const edition = await request.server.methods.deck.getLatestEdition()
      const connection = await request.server.methods.connection.update({
        to: request.params.userId,
        from: request.auth.credentials.user.id,
        edition: edition.id
      }, request.payload)
      return h.response(render(connection))
    } catch (err) {
      log.error({ err: err }, 'error updating connection')
      return Boom.boomify(err)
    }
  }
}

exports.deleteUserConnection = {
  options: {
    tags: ['api', 'connection'],
    auth: {
      strategies: ['default'],
      scope: ['user', 'company', 'team', 'admin']
    },
    validate: {
      params: Joi.object({
        userId: Joi.string().required().description('ID of the user connected with'),
      })
    }
  },
  handler: async function (request, h) {
    try {
      const edition = await request.server.methods.deck.getLatestEdition()
      const connection = await request.server.methods.connection.remove({
        from: request.auth.credentials.user.id,
        to: request.params.userId,
        edition: edition.id
      })
      if (!connection) {
        log.error({ err: 'connection not found' }, 'error deleting connection')
        return Boom.notFound('connection not found')
      }
      return h.response(render(connection))
    } catch (err) {
      log.error({ err: err }, 'error removing connection')
      return Boom.boomify(err)
    }
  }
}

exports.getUserConnections = {
  options: {
    tags: ['api', 'connection'],
    auth: {
      strategies: ['default'],
      scope: ['user', 'company', 'team', 'admin']
    },
  },
  handler: async function (request, h) {
    try {
      const edition = await request.server.methods.deck.getLatestEdition()
      const connections = await request.server.methods.connection.list({
        from: request.auth.credentials.user.id,
        edition: edition.id
      })
      return h.response(render(connections))
    } catch (err) {
      log.error({ err: err }, 'error getting user connections')
      return Boom.boomify(err)
    }
  }
}

exports.getCompanyConnections = {
  options: {
    tags: ['api', 'connection'],
    auth: {
      strategies: ['default'],
      scope: ['company', 'team', 'admin']
    },
    validate: {
      params: Joi.object({
        id: Joi.string().required().description('Company ID')
      })
    }
  },
  handler: async function (request, h) {
    try {
      const edition = await request.server.methods.deck.getLatestEdition()
      const companyId = request.params.id

      // Check if user belongs to company
      // if (request.auth.credentials.user.role === 'company') {
      //   const user = await server.methods.user.get({ id: request.auth.credentials.user.id })
      //   const userCompany = user.company.find((c) => c.edition === edition.id && c.company === companyId)
      //   if (!userCompany) {
      //     throw Boom.forbidden('user is not allowed')
      //   }
      // }

      const companyUsers = await request.server.methods.user.getCompanyUsers(companyId)
      const connections = await request.server.methods.connection.list({
        from: companyUsers.map(u => u.id),
        edition: edition.id
      })

      return h.response(render(connections))
    } catch (err) {
      log.error({ err: err }, 'error getting company connections')
      return Boom.boomify(err)
    }
  }
}
