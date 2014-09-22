var L = require('leaflet');
var acisTools = require('./acisTools');
var mapWithLegend = require('./mapWithLegend');

L.Icon.Default.imagePath = 'node_modules/leaflet/dist/images/';

// northeast view, but map will later be modified if data coverage differs
var map = L.map('map').setView([43.0, -74], 6);

var osm = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
	attribution: 'Map data &copy; 2011 OpenStreetMap contributors'
}).addTo(map);

// acis query input
acis_input = {
	'date':'2013-03-01',
	//'sdate':'2013-03-01',
	//'edate':'2013-03-03',
	'bbox':[-90, 40, -88, 41],
	'grid':'3',
	'elems':[
		{'name':'maxt'},
		],
	'meta':'ll',
	};

// create acis request options
acis_options = acisTools.acisGridOptions(acis_input);

// perform ACIS query, using options
acisTools.acisGridQuery(acis_options,function(err,resp,body) {
	if (err)
		return console.error('Request error:',err)
	if (body.error)
		return console.error('ACIS error:',body.error)

	// grab data from acis query
	climateData = acisTools.handle_data(body,0);
	//console.log(climateData)

	// input options for creating map with legend
	map_input = {
		// leaflet map object
		'map':map,
		// GeoJSON variable
		'geojsonData':climateData,
		// list of color hex codes used for displaying data. These will be assigned to evenly-
		// spaced data ranges. The number of data ranges will equal the number of colors provided
		'colorRange':['#fee0d2','#fcbba1','#fc9272','#fb6a4a','#ef3b2c','#cb181d','#a50f15','#67000d'],
		// Text header (html) used for legend
		'header':'Max Temp (&degF)',
		// type of legend: 0:basic, 1:update data ranges/color on move/zoom, 2:1+interactive mouseover highlights
		'legendType':2
		};

	// overlay data on map using options provided
	mapWithLegend(map_input);

});

