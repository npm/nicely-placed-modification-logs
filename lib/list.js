var fs = require('fs')
var once = require('once')
var path = require('path')



module.exports = listLogs

function listLogs (dir, suffix, cb) {

  console.log('LIST! ',dir)

  cb = once(cb)
  fs.readdir(dir, function (err, files) {
    if (err) return cb(err)
    var todo = files.filter(function (f) {
      return f.indexOf(suffix) === f.length - suffix.length
    })
    var c = todo.length

    var result = {
      order: [],
      data: {}
    }

    if (!c) return cb(false, result)

    stat()
    stat()

    function stat () {
      var f = todo.shift()
      if (!f) return
      var p = path.join(dir, f)
      result.order.push(p)
      fs.stat(p, function (err, s) {
        // stop everything.
        if (err) return cb(err)
        s._key = p
        result.data[p] = s
        if (!--c) return cb(false, result)
        stat()
      })
    }
  })
}
