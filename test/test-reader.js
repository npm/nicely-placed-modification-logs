var reader = require('../lib/reader')
var namelog = require('../lib/namelog')
var test = require('tape')

test("validate sequence false sequence",function(t){
  var suffix = '.log'
  var list = {order:['a.log','b.log','c.log','d.log']}

  var seq = false;
  var result = reader.validateSequence(list,seq,suffix)

  console.log(result)

  t.equals(result.offset,0,"should be starting at the beginnning of a new file")
  t.equals(result.file,'a','should be on file a')
  t.equals(result.path,'a.log','should have correct path')
  t.end()
})


test("validate sequence valid sequence",function(t){
  var suffix = '.log'
  var list = {order:['a.log','b.log','c.log','d.log']}

  var seq = {offset:10,file:'b',path:'b.log'}
  var result = reader.validateSequence(list,seq,suffix)

  console.log(result)

  t.equals(result.offset,10,"should have preserved offset")
  t.equals(result.file,'b','should be on file specified')
  t.equals(result.path,'b.log','should have correct path')
  t.end()
})

test("validate sequence missing expected sequence file",function(t){
  var suffix = '.log'
  var list = {order:['a.log','c.log','d.log']}

  var seq = {offset:10,file:'b',path:'b.log'}
  var result = reader.validateSequence(list,seq,suffix)

  console.log(result)

  t.equals(result.offset,0,"should start from 0")
  t.equals(result.file,'c','should be on file specified')
  t.equals(result.path,'c.log','should have correct path')
  t.end()
})

// this behavior is probably not a good way to handle this but it's documented
test("sequence doesnt match any valid sequence but is larger than the largest sequence",function(t){
  var suffix = '.log'
  var list = {order:['a.log','b.log','c.log','d.log']}


  var seq = {offset:10,file:'e',path:'e.log'}
  var result = reader.validateSequence(list,seq,suffix)

  console.log(result)

  t.equals(result.offset,0,"should be starting at the beginnning of a new file")
  t.equals(result.file,'a','should be on file a')
  t.equals(result.path,'a.log','should have correct path')
  t.end()
})

test("parse legacy sequence",function(t){
  var res = namelog.parseSeq("0000000000-42417232d460000000",'/','.log')
  t.equals(res.file,'0000000000')
  t.equals(res.ofset,19082566)
  t.end()  
})
