var listFiles = require('./list')
var tail = require('keep-reading')
var split = require('line-stream')
var nameLog = require('./namelog')
var path = require('path')
var through2 = require('through2')
var parseSeq = nameLog.parseSeq
var bw = require('bytewise')

module.exports = function (opts) {
  opts = opts || {}

  var dir = opts.dir
  var suffix = opts.suffix || '.log'
  var position = parseSeq(opts.start || opts.since || false, dir, suffix)

  if (!opts.dir) throw new Error('dir required')

  // add sequence id.
  var out = through2.obj(function (chunk, enc, cb) {
    chunk.seq = position.file+'-'+bw.encode(chunk.start + chunk.length) 
    cb(false, chunk)
  })

  var stream

  listFiles(dir, suffix, function (err, l) {
    if (err) return out.emit('error', err)
    out.list = l
    setup()
  })

  function setup () {
    var pos = validateSequence(out.list, position, suffix)

    // wait for any log files to appear
    if (!pos) {
      return setTimeout(function () {
        setup()
      }, 1000)
    }

    position = pos

    stream = streamFile(out, pos.path, pos.offset)
    stream.pipe(out, {end: false})
    handleStream(stream)
  }

  var ended = false
  function handleStream (stream) {
    if (ended) return stream.end()


    stream.on('waiting', function onWait (duration) {
      if (stream.listing) return

      if (duration <= 500) {
        // if the current list already has a next item use it
        if(haveMore()) checkList()
        // this causes a delay polling the directory for new log files. 
        return
      }

      stream.listing = true
      listFiles(dir, suffix, function (e, l) {
        if (e) return out.emit('error', e)
        out.list = l

        checkList()

        stream.listing = false
      })

      function checkList(){
        // check to see if we should move to the next file.
        var current = out.list.order.indexOf(position.path)

        if (current < out.list.order.length - 1) {
          var next = out.list.order[current + 1]
          position = {offset: 0, path: next, file: path.basename(next, suffix)}
          stream.removeListener('waiting', onWait)
          stream.end()

          return setup()
        }
      }

      function haveMore(){
        return out.list.order.indexOf(position.path) < out.list.order.length-1
      }
    })

    stream.on('error', function (err) {
      ended = true
      out.emit('error', err)
    })
  }

  out.on('end', function () {
    ended = true

    // should end keep-reading stream!
    stream.end()
  })

  return out
}

module.exports.validateSequence = validateSequence

function validateSequence (list, sequence, suffix) {
  if (!list.order.length) return false

  for (var i = 0; i < list.order.length; ++i) {
    if (list.order[i] === sequence.path) {
      // found matching sequence file.
      return sequence
    } else if (sequence.path < list.order[i]) {
      // missing sequence log file. lets start on the next log file
      return {offset: 0, file: path.basename(list.order[i], suffix), path: list.order[i]}
    }
  }
  // start from beginning
  var first = list.order[0]
  return {offset: 0, file: path.basename(first, suffix), path: first}
}

function streamFile (out, file, start) {
  var s = split({start: start,delimiter:"\n"})
  var data = tail(file, start)

  data.on('error', function (err) {
    s.emit('error', err)
  })

  data.on('waiting', function (duration) {
    s.emit('waiting', duration)
  })

  data.pipe(s)

  return s
}
