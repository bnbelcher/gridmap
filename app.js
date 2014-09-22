var L = require('leaflet');
var mapWithLegend = require('./mapWithLegend');

L.Icon.Default.imagePath = 'node_modules/leaflet/dist/images/';

// northeast view, but map will later be modified if data coverage differs
var map = L.map('map').setView([43.0, -74], 6);

var osm = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
	attribution: 'Map data &copy; 2011 OpenStreetMap contributors'
}).addTo(map);

// perform ACIS query, using options
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

