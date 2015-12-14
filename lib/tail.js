var fs = require('fs')
var eos = require('end-of-stream')
var through2 = require('through2')
var Backo = require('backo')

// dont stop reading this file and writing it's data to the output stream.
module.exports = keepReading

function keepReading (file, start) {
  var fd
  var backoff = new Backo({min: 100, max: 5000})

  start = +start || -1
  var s = through2(function (chunk, enc, cb) {
    chunk.offset = start
    start += chunk.length
    cb(false, chunk)
    backoff.reset()
  })

  makeStream(start)

  return s

  function makeStream () {
    // start is inclusive
    var opts = {start: start + 1}

    // reuse fd and do not close it when read stream is done.
    if (fd) {
      opts.fd = fd
    }

    opts.autoClose = false

    var rs = fs.createReadStream(file, opts)

    // cache the fd
    if (!fd) {
      rs.once('open', function (_fd) {
        if (!fd) {
          fd = _fd
          s.emit('open', fd)
        }
      })
    }

    rs.pipe(s, {end: false})

    eos(rs, function (err) {
      console.log('RS ended')
      if (err) return s.emit('error', err)

      if (!s.ended) {
        s.emit('waiting')
        setTimeout(function () {
          makeStream()
        }, backoff.duration())
      } else {
        // close fd
        fs.close(fd, function (err) {
          // expose for testing.
          s.emit('_fd_close', err)
        })
      }
    })
  }
}
