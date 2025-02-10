module.exports =
  function render (content) {
    if (content instanceof Array) {
      return content.map(renderObject)
    }

    return renderObject(content)
  }

function renderObject (model) {
  const result = {}

  result.from = model.from
  result.to = model.to
  result.edition = model.edition
  result.created = model.created
  result.updated = model.updated
  result.notes = model.notes

  return result
}
