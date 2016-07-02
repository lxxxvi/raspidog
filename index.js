var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var sh = require('shelljs');
sh.config.silent = true;
require('shelljs/global');

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.get('/jquery', function(req, res){
  res.sendFile(__dirname + '/node_modules/jquery/dist/jquery.min.js');
});

app.get('/stylesheet', function(req, res) {
  res.sendFile(__dirname + '/css/raspifarm-dog.css')
});

io.on('connection', function(socket){
  console.log('a user connected');

  socket.on('disconnect', function() {
    console.log('user disconnected');
    clearInterval(time);
  });


  time=setInterval(function(){
    exec(__dirname + '/workload.sh 192.168.17.15', function(status, output) {
      var workload = output.split(',');
      var cpu_idle          = workload[0];
      var memory_available  = workload[1] - 0;   // 745392
      var memory_total      = workload[2] - 0;   // 948012
      var memory_shared     = workload[3] - 0;   // 12260
      var memory_buffer     = workload[4] - 0;   // 16728
      var memory_cached     = workload[5] - 0;   // 147876

      // console.log(cpu_idle,memory_available,memory_total,memory_shared,memory_buffer,memory_cached);
      var memory_free = memory_available + memory_shared + memory_buffer + memory_cached; // 922256
      // console.log("free", memory_free);
      var memory_used = ( (memory_total - memory_free ) * 100 ) / memory_total;

      var response = {
        cpu: 100 - cpu_idle,
        memory: Math.round(memory_used)
      };

      io.emit('workload', response);
    });
    // exec('date', function(status, output) {
    //  io.emit('get date', "bla: " + output);
    // });
  },1000);

  socket.on('get date', function() {
    console.log("request received");

    // exec('date', function(status, output) {
    //  io.emit('get date', output);
    // });
  });

});

http.listen(3000, function(){
  console.log('listening on *:3000');
});