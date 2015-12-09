var common = require('./helper/common')
var writer = require('../lib/writer.js')
var test = require('tape')
var fs = require('fs')
var path = require('path')

var clean = common.clean()


test('can enforces maxSize', function (t) {
  var dir = path.join(__dirname,Date.now()+"_write")
  fs.mkdirSync(dir)

  clean.push(dir)

  var save = writer({dir:dir,maxSize:6})

  save("hi",function(err){
    t.ok(!err,'should not have error')

    save("hi",function(err){
      t.ok(!err,'should not have error')

      save("hi",function(err){
        t.ok(!err,'should not have error')

        var buf = fs.readFileSync(path.join(dir,'0000000000.log'))
        t.equals(buf.length,6,' in file 2 i should have 6 butes because that\'s the limit')

        var buf2 = fs.readFileSync(path.join(dir,'0000000001.log'))

        t.equals(buf2.length,3,'in file 1 i should have 3 bytes')

        // this is a good opportunity to make sure logstate has correct things
        var state = save.getState()

        t.equals(path.basename(state.order[0]),'0000000000.log','should have log files in order')
        t.equals(state.data[state.order[1]].size,3,'should have correct log size in bytes')

        t.end()
        clean()
      })
    })
  })

})


