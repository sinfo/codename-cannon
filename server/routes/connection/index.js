const server = require('../../').hapi
const handlers = require('./handlers')

// Create connection
server.route({
  method: 'POST',
  path: '/users/me/connections',
  options: handlers.createUserConnection.options,
  handler: handlers.createUserConnection.handler
})

// Get user connections
server.route({
  method: 'GET',
  path: '/users/me/connections',
  options: handlers.getUserConnections.options,
  handler: handlers.getUserConnections.handler
})

// Update connection
server.route({
  method: 'PUT',
  path: '/users/me/connections/{userId}',
  options: handlers.updateUserConnection.options,
  handler: handlers.updateUserConnection.handler
})

// Delete connection
server.route({
  method: 'DELETE',
  path: '/users/me/connections/{userId}',
  options: handlers.deleteUserConnection.options,
  handler: handlers.deleteUserConnection.handler
})

// Get company connections
server.route({
  method: 'GET',
  path: '/company/{id}/connections',
  options: handlers.getCompanyConnections.options,
  handler: handlers.getCompanyConnections.handler
})

