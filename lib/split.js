var through2 = require('through2')
var nl = "\n"

module.exports = nihSplit

// https://github.com/maxogden/binary-split/issues/7

function nihSplit(start){
  var _lastBuf = new Buffer(0);
  
  start = start||0

  var out = through2.obj(function(buf,enc,cb){
    var offset = 0
    var i = 0
    
    if(!Buffer.isBuffer(buf)) buf = new Buffer(buf)
    if(_lastBuf.length) buf = Buffer.concat([_lastBuf,buf])
    
    while((i = buf.indexOf(nl,offset)) > -1){
      console.log(i)
      // +2 includes \n in line event
      var b = buf.slice(offset,i+2)
      b.start = start+offset
      start += offset
      offset = i+1
      this.push(b)
    }

    out.fragment = _lastBuf = buf.slice(offset)
    cb()
  },function(cb){
    if(_lastBuf.length) {
      if(_lastBuf.indexOf(nl) === _lastBuf.length-1){
        this.push(_lastBuf)
      } else {
        _lastBuf.start = start
        this.emit('fragment',_lastBuf)
      }
    }
    cb()
  })

  out.fragment = _lastBuf

  return out
}

