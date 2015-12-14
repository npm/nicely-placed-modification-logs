var bsplit = require('binary-split')
var listLogs = require('./list')
var path = require('path')
var tail = require('./tail')
var through = require('through2')

module.exports = function (opts) {
  opts = opts || {}
  var suffix = opts.suffix || '.log'
  var dir = opts.dir
  var start = parseSeq(opts.since || false)

  var list
  var listing = false
  var s = bsplit('\n')

  // decorate buffers with sequence id.
  var out = through.obj(function (chunk, enc, cb) {
    start.offset += chunk.length + 1
    chunk.seq = start.offset + '-' + start.file
    this.push(chunk)
  })

  s.pipe(out)
  s.on('error', function (err) {
    out.emit('error', err)
  })

  var t

  if (start.path) startTail()
  else listFiles()

  return out

  function startTail () {
    if (t) t.end()
    t = tail(start.path, start.offset)

    t.on('waiting', function () {
      listFiles()
    })

    t.pipe(s, {end: false})

    t.on('error', function (err) {
      out.emit('error', err)
    })
  }

  function listFiles () {
    if (listing) return ++listing
    listing = 1

    listLogs(dir, suffix, function (err, data) {
      if (err) return out.emit(err)

      list = data
      var next = nextLog()

      if (next) {
        start = {path: next, file: path.basename(next, suffix), offset: 0}
        startTail()
      } else if (!t) {
        // if read was started before any files were created keep polling listFiles.
        listing += 1
      }

      listing = false
      if (listing > 1) {
        // prevent thrashing on listing for logs.
        setTimeout(function () {
          listing = false
          listFiles()
        }, 1000)
      } else {
        listing = false
      }
    })
  }

  function nextLog () {
    var cur = list.order.indexOf(start.path)
    return list.order[cur + 1]
  }
}

// extract data like file offset from sequence id.
// [offset]-[filename without suffix]
module.exports.parseSeq = parseSeq

function parseSeq (seq, dir, suffix) {
  var offset = +(seq.substr(0, seq.indexOf('-')) || 0)
  var file = seq.substr(seq.indexOf('-') + 1)
  return {offset: offset, file: file, path: path.join(dir, file + suffix)}
}
