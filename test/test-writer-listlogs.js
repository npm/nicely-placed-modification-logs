var common = require('./helper/common')
var path = require('path')
var rimraf = require('rimraf')
var test = require('tape')
var writer = require('../')

var clean = common.clean();

test('can list', function (t) {
  var dir = path.join(__dirname, Date.now() + '')
  clean.push(dir)

  common.mockDir(dir, '.foo', function (err, files) {
    t.ok(!err, 'should not have error making mock dir')
    writer.listLogs(dir, '.foo', function (err, data) {
      t.ok(!err, 'should not have error reading data from logs')

      t.equals(data.order.length, 2, 'should have 2 longs in the order')
      t.ok(data.data[files[0]].size, 'should have stat data for first log file')
      t.ok(data.data[files[1]].size, 'should have stat data for second log file')

      t.end()
      clean()
    })
  })

})

