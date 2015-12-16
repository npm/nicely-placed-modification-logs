var bsplit = require('binary-split')
var listLogs = require('./list')

var path = require('path')
var tail = require('keep-reading')

var through = require('through2')

module.exports = function (opts) {

  opts = opts || {}
  var suffix = opts.suffix || '.log'
  var dir = opts.dir
  var start = parseSeq(opts.since || false)

  if(!dir) throw new Error("missing required dir option")

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

  listFiles()

  return out

  function startTail () {
    if (t) t.end()
    t = tail(start.path, start.offset)

    t.on('waiting', function () {
      listFiles()
    }).on('end',function(){
      // should not end till i have already opened the next log.
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

    console.log('listing files!',dir)

    listLogs(dir, suffix, function (err, data) {
      if (err) {
        listing = 0
        if(err.code === 'ENOENT') {
          return setImmediate(function(){
            listFiles()
          },1000)
        }
        return out.emit('error',err)
      }
      console.log('got list!',data)

      list = data

      if(!t && start.path) {
        console.log('no files exist!')

        if(list.order.indexOf(start.path) > -1){
          //  this is the first time reading files.
          //  i have a sequence saved.
          //  this sequence exists in the list
          //  i need to finish this log before continuing to the next one.
          console.log('start path was provided!')
          startTail()
        }
      }
        
      var next = nextLog(start.path,list)
      
      console.log('next log is ',next)

      if (next) {
        start = {path: next, file: path.basename(next, suffix), offset: 0}
        startTail()
      } else if (!t) {

        // if read was started before any files were created keep polling listFiles.
        listing += 1
      }

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

// extract data like file offset from sequence id.
// [offset]-[filename without suffix]
module.exports.parseSeq = parseSeq

function parseSeq (seq, dir, suffix) {
  if(!seq) return false;
  var offset = +(seq.substr(0, seq.indexOf('-')) || 0)
  var file = seq.substr(seq.indexOf('-') + 1)
  return {offset: offset, file: file, path: path.join(dir, file + suffix)}
}
