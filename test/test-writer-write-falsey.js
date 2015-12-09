var common = require('./helper/common')
var writer = require('../')
var test = require('tape')
var fs = require('fs')
var path = require('path')

var clean = common.clean()

test('can write', function (t) {
  var dir = path.join(__dirname,Date.now()+"_write")
  fs.mkdirSync(dir)

  clean.push(dir)

  var save = writer({dir:dir})

  save.write(false,function(err){
    t.ok(err,'should have error')

    save.close()
    t.end()
    clean()
  })
})


