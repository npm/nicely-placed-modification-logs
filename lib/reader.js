var fs = require('fs')
var path = require('path')
var listLogs = require('./list') 
var bsplit = require('binary-split')
var eos = require('end-of-stream')

// THIS READ STREAM ONLY KNOWS HOW TO START FroM A SEQUENCE
// it does not know how to update a sequence

module.exports = function(opts){
  opts = opts||{}
  var suffix = opts.suffix||'.log'
  var dir = opts.dir
  var start = parseSeq(opts.since||false)

  var list
  var listing = false;
  var s = bsplit("\n")


  function checkList(){
    if(listing) return listing.push(cb)
    listLogs(dir,suffix,function(){

    })
  }

  function party(){
      keepReading(s,start.path,start.offset,function(){
        
      })
  }

  return t  
}

// extract data like file offset from sequence id.
// [offset]-[filename without suffix]
module.exports.parseSeq = parseSeq;

function parseSeq(seq,dir,suffix){
  var offset =+(seq.substr(0,seq.indexOf('-'))||0)
  var file = seq.substr(seq.indexOf('-')+1)
  return {offset:offset,file:file,path:path.join(dir,file+suffix)}
}

// dont stop reading this file and writing it's data to the output stream.
module.exports.keepReading = keepReading

function keepReading(s,file,start,handleEnded){
  var fd;
  
  function makeStream(start){
    // start is inclusive
    var opts = {start:(start||-1)+1}

    //reuse fd and do not close it when read stream is done.
    if(fd) {
      opts.fd = fd
      opts.autoClose = false
    }

    var rs = fs.createReadStream(file,opts)

    // cache the fd
    if(!fd) {
      rs.once('open',function(_fd){
        if(!fd) fd = _fd
      })
    }

    rs.pipe(s,{end:false})

    eos(rs,function(err){
      if(err) return s.emit('error',err)

      if(!s.ended) {
        (handleEnded||timeout)(function(end){
          if(end) return s.end()
          makeStream(start)
        })
      }
    })

    rs.on('data',function(buf){
      start += buf.length
    })
  }

  makeStream(start||0)

  return s

  function timeout(){
    setTimeout(cb,1000)
  }
}

