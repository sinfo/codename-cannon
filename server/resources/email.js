var config = require('config')
var server = require('server').hapi
var log = require('server/helpers/logger')
var nodemailer = require('nodemailer')
var sendmailTransport = require('nodemailer-sendmail-transport')

var options = {
  path: config.email.path
}

var transporter = nodemailer.createTransport(sendmailTransport(options))

server.method('email.send', send, {})

function send (mailOptions, cb) {
  log.debug({mailOptions: mailOptions}, 'sending email')

  mailOptions.from = mailOptions.from || config.email.from
  mailOptions.replyTo = mailOptions.replyTo || config.email.replyTo
  mailOptions.text = formatText(mailOptions.text)

  transporter.sendMail(mailOptions, function (err, info) {
    if (err) {
      log.error({mailOptions: mailOptions, info: info}, 'error sending email')
      return cb && cb()
    }

    log.debug({mailOptions: mailOptions, info: info}, 'sending email')

    cb && cb()
  })
}

function formatText (text) {
  var header = 'BOOOMMM!!\n\n'
  var footer = '\n\nSuch <3,\n\n' +
                '\xA0\xA0\xA0_||SINFOOOOOOO\n' +
                '_|   |__\n' +
                '\\oooooo/'
  return header + text + footer
}
