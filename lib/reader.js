var list = require('./list')
var tail = require('keep-reading')
var split = require('line-stream')
var nameLog = require('./namelog')
var path = require('path')
var through = require('through2')
var parseSeq = nameLog.parseSeq
var nextLog = nameLog.nextLog

module.exports = function(opts){

  opts = opts||{}

  var dir = opts.dir
  var suffix = opts.suffix||'.log'
  var position = parseSeq(opts.start||false)
  
  if(!opts.dir) throw new Error('dir required')

  // add sequence id.
  var out = through2.obj(function(chunk,enc,cb){
    chunk.seq = (chunk.offset+chunk.length)+'-'+seqName
    cb(false,chunk)
  })

  var stream;

  function setup() {
    list(dir, suffix, function(err,l){
      if(err) return out.emit('error',err)

      var pos = validateSequence(list,position,suffix)
      
      // wait for any log files to appear
      if(!pos) {
        return setTimeout(function(){      
          setup()
        },1000)
      }

      stream = streamFile(seqName,path,start)
      stream.pipe(out)
      handleStream(stream)
    })
  }

  var ended = false
  function handleStream(stream){
    if(ended) return stream.end();

    stream.on('waiting',function(duration){
      if(duration <= 1000) return
      if(stream.listing) return

      stream.listing = false
      list(dir,suffix,function(e,l){
        if(e) return out.emit('error',e)

        // check to see if we should mpove to the next file.
        if(l.order.indexOf(position.path) < l.order.length-1) {
          
        }
      })
    })

    stream.on('error',function(err){
      ended = true
      out.emit('error',err)
    })
  }

  out.on('end',function(){
    ended = true
  })

  return out;
}

module.exports.validateSequence = validateSequence

function validateSequence(list,sequence){
  if(!list.order.length) return false

  var before
  for(var i=0;i<list.order.length;++i){
    if(list.order[i] === sequence.path){
      // found matching sequence file.
      return sequence
    } else if(sequence.path < list.order[i]){
      // missing sequence log file. lets start on the next log file
      return {offset: 0, file: path.basename(list.order[i],suffix), path: list.order[i]} 
    }
  }
  // start from beginning
  var first = list.order[0]
  return {offset:0,file:path.basename(first,suffix),path:first}
}

function streamFile(seqName,path,start){
  var splitter = split({start:start})
  var data = tail(file,start)

  data.on('error',function(err){
    out.emit('error',err)
  })

  data.on('waiting',function(duration){
    out.emit('waiting',duration)
  })

  data.pipe(splitter())

  return data
}
