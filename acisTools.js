var request = require('request');
var pack    = require('ndarray-pack');

exports.acisGridOptions = function (input) {
	var urlBase = 'http://data.rcc-acis.org/'
	var method = 'GridData'
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
	// pack the data into an ndarray (pack)
	var this_date = d.data[i][0];
	var this_lat  = pack(d.meta.lat);
	var this_lon  = pack(d.meta.lon);
	var this_data = pack(d.data[i][1]);
	return {
		lat: this_lat,
		lon: this_lon,
		data: this_data
	};
}

