# nicely-placed-modification-logs
write modifications/events to append only logs. process those changes sequentially. like an _changes feed but in a file

##**work in progress**

```js
var dir = __dirname+"/data"
var modlogs = require('nicely-placed-modification-logs')
var logs = modlogs({dir:__dirname+"/data"})

logs.on("error",function(err){
  console.log(err!)
})

logs.write({data:"important stufff"},function(err){
  // saved!
})

var s = modlogs.read({dir:,since:0})

s.on('data',function(event){
  console.log(event.seq)
  // [log name]-[byte offset]
  // 000000000-0
  console.log(event.data)
  // "hi!\n"  
})

```

READER
------

```js

var modlogs = require('nicely-placed-modification-logs')

// optional place to start from in the new stream
var seq = "22-0000001"
var stream = modlogs.read({dir:__dirname+"/data", start:seq})

stream.on('data',function(line){
  // this is the sequence id used to resume
  console.log(line.seq)
  console.log(line+'')
})

```

