var test = require('tape')

var namelog = require('../lib/namelog')

test("can get next log",function(t){
  var list = {
    order:['a','b','c']
  }

  t.equals(namelog.nextLog('b',list),'c','gets next log')

  t.equals(namelog.nextLog(undefined,list),'a','gets first log if eundefined log')

  t.equals(namelog.nextLog('azzz',list),'b','gets next log if log is missing from order')

  t.end()
})


