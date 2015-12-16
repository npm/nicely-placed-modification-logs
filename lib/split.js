var through2 = require('through2')
var nl = "\n"
var empty = new Buffer(0)
module.exports = nihSplit

// i had hoped to use binary-split but it seems that the changes i needed were not desired.
// https://github.com/maxogden/binary-split/issues/7

function nihSplit(start){
  
  start = start||0

  var out = through2.obj(function(buf,enc,cb){
    var offset = 0
    var i = 0
    
    if(!Buffer.isBuffer(buf)) buf = new Buffer(buf)
    if(this.fragment.length) {
      buf = Buffer.concat([this.fragment,buf])
      // make sure fragment won't be observed in an invalid state
      this.fragment = empty
    }
    
    while((i = buf.indexOf(nl,offset)) > -1){
      var b = buf.slice(offset,i+1)
      b.start = start+offset
      offset = i+1
      this.push(b)
    }
    
    this.fragment = buf.slice(offset)
    start += buf.length-this.fragment.length
    cb()
  },function(cb){
    if(this.fragment.length) {
      if(this.fragment.indexOf(nl) === this.fragment.length-1){
        this.push(this.fragment)
      } else {
        this.fragment.start = start
        this.emit('fragment',this.fragment)
      }
    }
    cb()
  })

  out.fragment = empty

  return out
}

