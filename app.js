var L = require('leaflet');
var acisTools = require('./acisTools');
var contourGrid = require('./contourGrid');

L.Icon.Default.imagePath = 'node_modules/leaflet/dist/images/';

// acis query input
var acis_input = {
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

// initialize map object and fit bounds to requested data
var map = L.map('map');
map.fitBounds([[acis_input.bbox[1],acis_input.bbox[0]],[acis_input.bbox[3],acis_input.bbox[2]]]);

// OpenStreetMap object
var osm = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
	attribution: 'Map data &copy; 2011 OpenStreetMap contributors'
}).addTo(map);

// create acis request options from input
var acis_options = acisTools.acisGridOptions(acis_input);

// perform ACIS query, using options
acisTools.acisGridQuery(acis_options,function(err,resp,body) {
	if (err)
		return console.error('Request error:',err)
	if (body.error)
		return console.error('ACIS error:',body.error)

	// data from acis query as typed arrays. Original ACIS data is flipped N/S. 
	var grid = acisTools.handle_data(body,0);

	// input options for creating map with legend
	var map_input = {
		// leaflet map object
		'map':map,
		// Grid data
		'gridData':grid,
		// number of contour levels when displaying isolines in visible window
		'numLevels':3
		};

	// overlay contours on map using options provided
	contourGrid(map_input);

});

