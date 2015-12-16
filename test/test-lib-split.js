var test = require('tape')
var split = require("../lib/split")

test("can split",function(t){

  t.plan(9)

  var s = split()

  var stage = 1
  var buf = []
  s.on('data',function(b){
    if(stage === 1) {
      
      buf.push(b)
      if(buf.length === 3){
        setImmediate(function(){
          t.equals(buf.length,3,'should have 3 items')
          t.equals(buf[0]+'','1\n','should include newlines')
          t.equals(buf[1].start,2,'should have correct start position')
          t.equals(buf[2].start,buf[1].start+buf[1].length,'should have correct start offset calculated from previous')
          t.equals(s.fragment+'','4','should have 4 in fragment')
          stage = 2
          buf = []
          s.write("\n5\n6\n7\n")
        })
      }
    } else if(stage === 2){
      buf.push(b)
      if(buf.length === 4){
        t.equals(buf[buf.length-1]+'','7\n','should have last line')
        t.equals(s.fragment.length,0,'should have empty fragment')

        stage = 3
        buf = []

        s.write('end fragment')

        s.end()
      }
    }
  })

  s.on('fragment',function(f){
    t.equals(f+'','end fragment','should emit fragment')
    t.equals(f.start,13,'fragment start should be correct')
    
  })

  s.write("1\n2\n3\n4")
})
