var request = require('request');

exports.acisGridOptions = function (input) {
	urlBase = 'http://data.rcc-acis.org/'
	method = 'GridData'
	var options = {
		method: 'POST',
		url: urlBase+method,
		withCredentials: false,
		headers: {
			'Content-Type': 'application/json'
		},
		json: input
	};
	return options;
}

exports.acisGridQuery = function (options,callback) {
	// Make ACIS request
	request(options, function (err,response,body) {
		if (err)
			return callback(err)
		//var dataArray = body.data[0][1];
		callback(null,response,body)
		//console.log(body)
	})
}

exports.handle_data = function (d,i) {
	this_date = d.data[i][0];
	this_lat  = d.meta.lat;
	this_lon  = d.meta.lon;
	this_data = d.data[i][1];
	// flatten arrays
	this_lat_flat = [];
	this_lat_flat = this_lat_flat.concat.apply(this_lat_flat,this_lat);
	this_lon_flat = [];
	this_lon_flat = this_lon_flat.concat.apply(this_lon_flat,this_lon);
	this_data_flat = [];
	this_data_flat = this_data_flat.concat.apply(this_data_flat,this_data);
	// create GeoJSON
	var gridData = {};
	gridData.type = 'FeatureCollection';
	gridData.features = [];
	for (var i = 0; i < this_data_flat.length; i++) {
		id = i + 1;
		thisGrid = {};
		thisGrid.type = 'Feature';
		thisGrid.id = id.toString();
		thisGrid.properties = {};
		thisGrid.properties.name = 'grid'+thisGrid.id;
		thisGrid.properties.data = parseInt(this_data_flat[i]);
		thisGrid.geometry = {};
		thisGrid.geometry.type = 'Point';
		thisGrid.geometry.coordinates = [parseFloat(this_lon_flat[i]),parseFloat(this_lat_flat[i])];
		gridData.features.push(thisGrid);
	}
	return gridData;
}

