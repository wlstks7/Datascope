// Requires Express.js

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var crossfilter = require("./crossfilter.v1.min.js").crossfilter;
var fs = require('fs');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));



var visual_attributes = [];
var filtering_attributes = [];

//Read the schema
var schema = fs.readFileSync("public/data-schema.json");
schema = JSON.parse(schema);
//console.log(schema)
for(var attribute in schema){
	console.log(attribute)
	if(schema[attribute]["visual-attribute"])
		visual_attributes.push(schema[attribute]["name"])
}
//console.log(visual_attributes)
// Read the CSV file into flights
var dataraw = fs.readFileSync("mil_data.json");
//var dataraw = fs.readFileSync("250_data.json")
data = JSON.parse(dataraw)


var ndx = crossfilter(data),
  dimensions = {
    Ai: ndx.dimension(function (d){return d.Ai;}),
    Bi: ndx.dimension(function (d){return d.Bi;}),
    Ci: ndx.dimension(function (d){return d.Ci;}),
    Di: ndx.dimension(function (d){return d.Di;}),
    age: ndx.dimension(function (d){return d.age;}),
    gender: ndx.dimension(function (d){return d.gender;}),
    isActive: ndx.dimension(function (d) {return d.isActive;}),
    Gf: ndx.dimension(function (d){return d.Gf}),
    Hf: ndx.dimension(function (d){return d.Hf})
  },
  groups = {
    Ai: dimensions.Ai.group(),
    Bi: dimensions.Bi.group(),
    Ci: dimensions.Ci.group(),
    Di: dimensions.Di.group(),
    age: dimensions.age.group(),
    gender: dimensions.gender.group(),
    isActive: dimensions.isActive.group(),
    Gf: dimensions.Gf.group(function(d){return Math.round(d*10)/10;}),
    Hf: dimensions.Hf.group(function(d){return Math.round(d*10)/10;})
  }
  size = ndx.size(),
  all = ndx.groupAll();

// Handle the AJAX requests
app.use("/data",function(req,res,next) {
  
  console.log("Getting /data")
  filter = req.param("filter") ? JSON.parse(req.param("filter")) : {}
  // Loop through each dimension and check if user requested a filter

  // Assemble group results and and the maximum value for each group
  var results = {} 
  var filter_dim;
  var filter_range=[];
  //console.log(filter[dim])
  for(var key in filter){
    filter_dim= key;
  }
  
  Object.keys(dimensions).forEach(function (dim) {

    if (filter[dim]) {
      // In this example the only string variables in the filter are dates
      //console.log("here")
      //console.log(dim)
      console.log("here")
      console.log(filter[dim][0])
      

      if(typeof filter[dim][0] ==='string'){
      	if(filter[dim][0] == "true"){
      		filter[dim] = [0,filter[dim][1]]
      	}else{
      		filter[dim] = [1,filter[dim][1]]
      	}
      }

      dimensions[dim].filterRange(filter[dim])
    } else {
      dimensions[dim].filterAll(null)
    }
  })
  
  if(Object.keys(filter).length === 0){
      //dimensions["Ai"].filter(null)
      results["table_data"] = {data:dimensions["Ai"].top(100)}
  }
  else{
      //dimensions[filter_dim].filterRange(filter_range)
      results["table_data"] = {data:dimensions[filter_dim]  .top(100)}
  }
  Object.keys(groups).forEach(function(key) {
      results[key] = {values:groups[key].all(),top:groups[key].top(1)[0].value}
  })
  //console.log(results)
  //console.log(dimensions["age"].top(100))  
  // Send back as json
  res.writeHead(200, { 'content-type': 'application/json' });
  res.end((JSON.stringify(results)))
})

// Change this to the static directory of the index.html file
app.get('/', routes.index);
app.get('/index2.html', routes.index2)
app.get('/index3.html', routes.index3)
app.get('/users', user.list);

var port = process.env.PORT || 3000;
app.listen(port,function() {
  console.log("listening to port "+port)  
})