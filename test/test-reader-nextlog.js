var test = require('tape')

var reader = require('../lib/reader')

test("can get next log",function(t){
  var list = {
    order:['a','b','c']
  }

  t.equals(reader.nextLog('b',list),'c','gets next log')

  t.equals(reader.nextLog(undefined,list),'a','gets first log if eundefined log')

  t.equals(reader.nextLog('azzz',list),'b','gets next log if log is missing from order')

  t.end()
})


