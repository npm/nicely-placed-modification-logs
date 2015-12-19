var path = require('path')

module.exports = nameLog

function nameLog (p, suffix, previous) {
  if (!previous) return path.join(p, padNum(0) + suffix)
  var name = path.basename(previous, suffix)
  return path.join(p, padNum(+unPad(name) + 1) + suffix)
}


// extract data like file offset from sequence id.
// [offset]-[filename without suffix]
module.exports.parseSeq = parseSeq

function parseSeq (seq, dir, suffix) {
  if(!seq) return false;
  var offset = +(seq.substr(0, seq.indexOf('-')) || 0)
  var file = seq.substr(seq.indexOf('-') + 1)
  return {offset: offset, file: file, path: path.join(dir, file + suffix)}
}


module.exports.nextLog = nextLog

function nextLog (current,list) {
  var cur = list.order.indexOf(current)

  // find the next log file after the missing log.
  if(cur === -1 && current) {
    var next
    list.order.some(function(p){
      if(current < p) {
        next = p
        return true
      }
    })

    if(next) return next
  }

  return list.order[cur + 1]
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
