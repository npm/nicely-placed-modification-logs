var path = require('path')

module.exports = nameLog

function nameLog (p, suffix, previous) {
  if (!previous) return path.join(p, padNum(0) + suffix)
  var name = path.basename(previous, suffix)
  return path.join(p, padNum(+unPad(name) + 1) + suffix)
}

function padNum (n, to) {
  to = to || 10
  n = n + ''
  while (n.length < to) n = '0' + n
  return n
}

function unPad (n) {
  return n.replace(/^[0]+/, '')
}
