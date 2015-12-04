var fs = require('fs')
var once = require('once')
var path = require('path')

module.exports = function(opts){
  opts = opts||{}

  // must exist
  opts.dir

  // is when i make another log
  opts.maxSize

  var suffix = opts.suffix||'.log'

  // returns file descriptor to log.
  function openLog(){
      
  }


  listLogs(opts.dir,suffix,function(){
  
  })

  return function(data,cb){
  
  }
}

module.exports.listLogs = listLogs

function listLogs(dir,suffix,cb){
  cb = once(cb)
  fs.readdir(dir,function(err,files){
    if(err) return cb(err)
    var todo = files.filter(function(f){
      return f.indexOf(suffix) === f.length-suffix.length
    })
    var c = todo.length;

    var result = {
      order:[],
      data:{}
    }

    if(!c) return cb(false,result)

    stat()
    stat()

    function stat(){
      var f = todo.shift()
      if(!f) return
      var p = path.join(dir,f)
      result.order.push(p)
      fs.stat(p,function(err,s){
        // stop everything.
        if(err) return cb(err)

        result.data[p] = s
        if(!--c) return cb(false,result)
        stat()
      })
    }

  })
}
