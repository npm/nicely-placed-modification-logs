var fs = require('fs')
var path = require('path')

module.exports = {}

module.exports.mockDir = function (dir, suffix, cb) {
  fs.mkdir(dir, function () {
    var events = new Array(1000)
    for (var i = 0;i < 1000;++i) events[i] = i
    events = events.join('\n')

    fs.writeFile(path.join(dir, 'silly'), 'silly', function (err) {
      var c = 2
      var files = []
      var start = Date.now()

      log()
      log()

      function log () {
        var file = path.join(dir, (++start) + suffix)
        files.push(file)
        fs.writeFile(file, events, function (err) {
          if (err) return cb(err)

          if (!--c) cb(false, files)

        })
      }
    })

  })
}


module.exports.clean = function(){

  var files = []
  process.once('uncaughtException', clean)
  process.once('exit', clean)

  function clean (err) {
    while(files.length) {
      try {
        rimraf.sync(files.shift())
      } catch(e) {}
    }
    if (err) process.emit('error', err)
  }

  clean.push = function(){
    files.push.apply(arguments)
  }

  return clean
}
