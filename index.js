const update = require('immutability-helper');
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser')

const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'client/build')));
app.use(bodyParser.json())

// Initial entries
// Should eventually hook this up to a database and replace this with a database call
var entries = [{
  	id: 1,
  	parent: 'BLUE',
  	username: "John Smith",
  	message: 'potentially interested client',
  	qty: 100000
  },{
  	id: 2,
  	parent: 'CTLT',
  	username: "Jane Doe",
  	message: 'deal almost done',
  	qty: 50000
}];

// Put all API endpoints under '/api'
// ****************************************
//                 GETS 
// ****************************************
app.get('/api/all', (req, res) => {
  console.log("get all entries");
  // TODO: add database call
  res.json(entries);
});

app.get('/api/sums', function(req, res, next) {
  console.log("get total qty reserved for all entries");
  var result = {};
  
  for (var i = 0, len = entries.length; i < len; i++) {
    // using parent code as key, keep track of total qtys across entries
    var parent = entries[i].parent;
    result[parent] = (parseInt(result[parent]) || 0) + parseInt(entries[i].qty);
  }
  
  // return dictionary with keys of parent code and values of qty
  res.json(result);
})

app.get('/api/size', function(req, res, next) {	
  console.log("get number of entries per parent code");
  var histogram = {};

  for (var i = 0, len = entries.length; i < len; i++) {
    var parent = entries[i].parent;
    histogram[parent] = (histogram[parent] || 0) + 1;
  }

  res.json(histogram);
});

app.get('/api/getOne', function(req, res, next) {
  // TODO: standardize use of single vs double quotes
  console.log('get all entries for the following code: ${req.query.code}');
  
  var filteredArray = entries.filter(function(obj) {
    return obj.parent === req.query.code;
  });
  
  res.json(filteredArray);
});

// The "catch all" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname+'/client/build/index.html'));
});

// ****************************************
//                 POSTS 
// ****************************************

//Save post of IOI comment
app.post('/api/saveIOI', function(req, res) {
	console.log("saving new IOI");
    console.log(req.body);
  
    // generate new id based on length of entries
    // assumes nothing gets deleted
    // TODO: change to unique ids
    // https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
	req.body.id = entries.length + 1;
	entries.push(req.body);
});

app.post('/api/updateIOI', function(req, res) {
  console.log("saving update to IOI");
  console.log(req.body);
  
  var elementPos = entries.map(function(x) {return x.id; }).indexOf(req.body.id);
  
  entries[elementPos] = req.body;
    
  var total = 0;
  
  for (var i = 0, len = entries.length; i < len; i++) {
    var parent = entries[i].parent;
    if ( parent === entries[elementPos].parent ) {
      total += parseInt(entries[i].qty, 10);
    }
  }  

  var updated = { code: entries[elementPos].parent, countChange: total };
  // brodcast update to all listening sockets
  io.sockets.emit('update', updated);
})

// ****************************************
//                SOCKETS
// ****************************************

io.on('connection', function(socket){
  console.log('a user connected');

  socket.on('disconnect', function() {
    console.log('user disconnected');
  });
  
  socket.on('saveNew', (data) => {
    console.log("received new save via socket")
    console.log(data);
    io.sockets.emit('new', data);
  })
});

// ****************************************
//                  PORT
// ****************************************

const port = process.env.PORT || 5000;
http.listen(port);

console.log(`React Axe-Viewer listening on ${port}`);