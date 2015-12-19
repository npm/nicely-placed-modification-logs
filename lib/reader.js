var list = require('./list')
var tail = require('keep-reading')
var split = require('line-stream')
var nameLog = require('./namelog')
var path = require('path')
var parseSeq = nameLog.parseSeq
var nextLog = nameLog.nextLog

module.exports = function(opts){

  opts = opts||{}

  var dir = opts.dir
  var position = parseSeq(opts.start||false)
  
  if(!opts.dir) throw new Error('dir required')

  var stream;

  // so get a list
  //  - do i have a stream?
  //    - is my sequence valid
  //  - what file am i working on?
  //  - should i keep working on this file
  //    <no>
  //    - whats the next file?
  //    - new stream
  //    <yes>
  //    - wait for next waiting event



  (function listAndLoop(){
    list(dir,function(err,list){

      if(err) return out.emit('error',err)

      if(!stream) {
        if(position.path) stream = streamFile(positon.path,position.offset||0)
        else {
          nextLog()
        }
      //  stream =  
        
      }

      stream.once("waiting",onWait)
      stream.on('error',function(err){
        out.emit('error',err)
      })

      function onWait(ms){

        if(list.order[list.order.length-1] > position.file){

          stream.end();
          position
        }

        listAndLoop() 
      }
    })
  }())




  return out;
}

module.exports.validateSequence = validateSequence

function validateSequence(list,sequence,suffix){
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

function streamFile(file,start){
  var splitter = split({start:start})
  var data = tail(file,start)

  data.on('error',function(err){
    splitter.emit('error',err)
  })

  data.on('waiting',function(duration){
    splitter.emit('waiting',duration)
  })

  data.pipe(splitter())

  return splitter
}
