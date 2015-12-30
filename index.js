var fs = require('fs')
var once = require('once')
var path = require('path')
var EE = require('events').EventEmitter


// {dir: REQUIRED, size: 1e+9, suffix:".log", delimiter:"\n"}
module.exports = function (opts) {
  opts = opts || {}

  var emitter = new EE

  // must exist
  if (!opts.dir) {
    return setImmeidate(function(){
      emitter.emit('error',new Error('data directory opts.dir required'))
    })
  }
  // is when i make another log
  var maxSize = opts.maxSize || 1e+9
  var suffix = opts.suffix || '.log'
  var delim = opts.delimiter || '\n'

  var _q = []
  var logState
  var processing = false
  var opening = false
  var _fd = false

  // figure everything out then save anything that's waiting.
  listLogs(opts.dir, suffix, function (err, results) {
    // TODO make a good story for errors and refactor
    if (err) throw err
    logState = results
    process()
  })

  // create export function
  function logFunction (data, cb) {
    if (!data || emitter._stopped) {
      return setImmediate(function () {
        cb(!data?new Error('log function called with falsy data'):new Error("emitter has been stopped"))
      })
    }

    var isBuffer = Buffer.isBuffer(data)
    if (!isBuffer && typeof data === 'object') {
      data = JSON.stringify(data) + delim
    } else {
      // data must have delimiter.
      var d = delim
      if (isBuffer) {
        d = delim.charCodeAt(0)
        if (data[data.length - 1] !== d) data = Buffer.concat([data, new Buffer(delim)])
      } else if (data.charAt(data.length - 1) !== delim) {
        data = new Buffer(data + delim)
      }
    }

    _q.push([data, cb])
    process()
  }

  emitter.write = logFunction
  emitter._q = _q
  emitter.close = stop
  emitter.getState = function(){ 
    return logState
  }


  return emitter

  function stop(err){
    emitter._stopped = true
    if(err) emitter.emit('error',err)
    if(_fd !== false && !processing) {
      var f = _fd
      _fd = false
      fs.close(f,function(){
        // best effort made.
      })     
 
    }
  }

  // returns file descriptor to log if there is one
  function currentLog () {
    if(!logState.order.length) return;
    var newKey = logState.order[logState.order.length - 1]
    var newest = logState.data[newKey]
    if (newest.size < maxSize) return newKey
  }

  // manage the single active  file descriptor
  // makes a new file if there isn't one
  function openLog (p, cb) {
    if (_fd !== false) fs.close(_fd, _o)
    else _o()

    function _o (err) {
      if (err) return cb(err)
      if (opening) return cb(new Error('cannot open multiple file descriptors at the same time!!'))
      opening = true

      fs.open(p, 'a', function (err, fd) {
        if (err) return cb(err)
        opening = false
        _fd = fd
        fs.stat(p, function (err, data) {
          if (err) return cb(err)

          logState.order.push(p)
          logState.data[p] = data
          cb(err, p)
        })
      })
    }
  }

  // handle writing the buffered data and calling callbacks.
  function process () {
    if (processing || !logState) return
    if (!_q.length) return

    processing = true

    var logPath = currentLog()
    if (_fd === false || !logPath) {
      if (!logPath) logPath = nameLog(opts.dir, suffix, logState.order[logState.order.length - 1])
      return openLog(logPath, function (err) {
        // if err call all callbacks with error. probably just crash.
        if (err) return emitter.emit('error',err)

        write()
      })
    }

    write()

    // get file descriptor

    function write () {
      var bufs = []
      var cbs = []
      var a
      while (_q.length) {
        a = _q.shift()
        bufs.push(a[0])
        cbs.push(a[1])
      }
      // perform all writes

      if(bufs.length > 1) bufs = Buffer.concat(bufs)
      else bufs = bufs[0]

      fs.write(_fd, bufs, 0, bufs.length, function (err) {
        if (err) return done(err)
        // sync to sure the data is really on disk so i never will say something made it without it actually making it.
        fs.fsync(_fd, function (err) {
          // TODO update size in logState
          logState.data[logState.order[logState.order.length - 1]].size += bufs.length

          // call all callbacks
          done(err)
        })
      })

      function done (err) {
        processing = false
        while (cbs.length) cbs.shift()(err)
        if(emitter._stopped && _fd) {
          var f = _fd
          _fd = false
          fs.close(f,function(){
            // all done
          })
        }
      }
    }
  }
}

var listLogs = require('./lib/list')
module.exports.listLogs = listLogs

module.exports.read = require('./lib/reader')

var nameLog = require('./lib/namelog')
module.exports.nameLog = nameLog

