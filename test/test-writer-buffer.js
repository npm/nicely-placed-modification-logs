var common = require('./helper/common')
var writer = require('../lib/writer.js')
var test = require('tape')
var fs = require('fs')
var path = require('path')

var clean = common.clean()

test('can serialize written object', function (t) {
  var dir = path.join(__dirname,Date.now()+"_write")
  fs.mkdirSync(dir)

  clean.push(dir)

  var save = writer({dir:dir})
 
  var b = new Buffer("hi")
  save(b,function(err){
    t.ok(!err,'should not have error')

    var buf = fs.readFileSync(path.join(dir,'0000000000.log'))
    t.equals(buf+"",'hi\n','should have written buffer')

    t.end()
    clean()
  })
})


