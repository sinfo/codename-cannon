module.exports = function render (content, user, editionId, expand) {
  if (content instanceof Array) {
    return content.map(model => renderObject(model, user, editionId, expand))
  }

  return renderObject(content, user, editionId, expand)
}

function renderObject (model, user, editionId, expand = false) {
  const result = {}
  const isAdmin = user && (user.role === 'admin' || model.id === user.id)
  const isTeam = user && (user.role === 'team' || isAdmin)

  result.id = model.id
  result.name = model.name
  result.img = model.img || 'https://sinfo.ams3.cdn.digitaloceanspaces.com/static/26-sinfo/hacky/hacky.png'
  result.role = model.role
  result.shareLinks = model.shareLinks
  result.points = model.points !== undefined && typeof model.points === 'number'
    ? model.points : undefined
  result.registered = model.registered

  if (expand) {
    result.signatures = model.signatures && model.signatures.map(signature => ({
      edition: signature && signature.edition,
      day: signature && signature.day,
      redeemed: signature && signature.redeemed,
      signatures: signature && signature.signatures
    }))
    result.title = model.title
    result.nationality = model.nationality
    result.skills = model.skills
    result.interestedIn = model.interestedIn
    result.lookingFor = model.lookingFor
    result.academicInformation = model.academicInformation
    result.contacts = model.contacts

    if (user && model.id === user.id) {
      if (editionId) {
        result.connections = model.connections[editionId]
      }
    }
  }


  if (isAdmin || isTeam) {
    result.mail = model.mail
    result.facebook = model.facebook && {
      id: model.facebook && model.facebook.id
    }
    result.linkedin = model.linkedin && {
      id: model.linkedin && model.linkedin.id
    }
    result.google = model.google && {
      id: model.google && model.google.id
    }
    result.fenix = model.fenix && {
      id: model.fenix && model.fenix.id
    }
    result.job = model.job && {
      startup: model.job && model.job.startup,
      internship: model.job && model.job.internship,
      start: model.job && model.job.start
    }
    result.updated = model.updated
    result.company = model.company && model.company.map(participation => ({
      edition: participation && participation.edition,
      company: participation && participation.company
    }))
  } else {
    //a normal user should only be allowed to view the employee's current company
    //TODO: fetch editionID from deck instead of receiving it from the webapp
    result.company = model.company && model.company.map(participation => {
      if(participation.edition === editionId) {
        return ({
          edition: participation && participation.edition,
          company: participation && participation.company
        })
      }
    })
  }

  return result
}
