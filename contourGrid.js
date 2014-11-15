var ops = require('ndarray-ops');
var unpack = require('ndarray-unpack');
var conrec = require('./conrec/conrec.js');

module.exports = function (args) {

	// extract variables from input
	map = args['map']
	grid = args['gridData']
	numLevels = args['numLevels']
	// missing value - used for indices if no data is in visible window
	miss = -999

	// function tests if object is in a list
	function contains(obj, list) {
		for (var i=0; i<list.length; i++) {
			if (list[i] === obj) { return true }
		}
		return false;
	}

	function getIndexBounds() {
		// find visible indices of grid array

		// current map bounds
		var bounds = map.getBounds();
		var latS_m = bounds._southWest.lat
		var lonW_m = bounds._southWest.lng
		var latN_m = bounds._northEast.lat
		var lonE_m = bounds._northEast.lng

		// 1-D ndarrays of lat and lon
		var lat = unpack(grid.lat.pick(null,0));
		var lon = unpack(grid.lon.pick(0,null));

		// if all data are out of visible bounds, set indices to missing
		if ((latS_m>lat[lat.length-1]) || (latN_m<lat[0]) || (lonW_m>lon[lon.length-1]) || (lonE_m<lon[0])) {
			console.log('data out of bounds : indices of grid set to missing and no data displayed');
			return [miss,miss,miss,miss]
		}

		// Find the grid's extreme indices that are within visible data
		// - finding each of the S/N/W/E indices individually.

		// SOUTH INDEX
		var idxS = miss;
		// first, handle cases where southern edge of visible window is inside available data bounds
		for (var i=0; i<lat.length-1; ++i) {
			if (lat[i]==latS_m) {
				idxS = i;
			} else if (lat[i+1]==latS_m) {
				idxS = i+1;
			} else if (lat[i]<latS_m && lat[i+1]>latS_m) {
				idxS = i+1;
			} else {
				idxS = miss;
			}
			if (idxS!=miss) break;
		}
		// next, handle cases where southern edge of visible window is outside of available data bounds
		if (latS_m<lat[0]) idxS=0;
		if (latS_m>lat[lat.length-1]) idxS=miss;
		if (idxS==miss) { return [miss,miss,miss,miss] }

		// NORTH INDEX
		var idxN = miss;
		// first, handle cases where northern edge of visible window is inside available data bounds
		for (var i=0; i<lat.length-1; ++i) {
			if (lat[i]==latN_m) {
				idxN = i;
			} else if (lat[i+1]==latN_m) {
				idxN = i+1;
			} else if (lat[i]<latN_m && lat[i+1]>latN_m) {
				idxN = i;
			} else {
				idxN = miss;
			}
			if (idxN!=miss) break;
		}
		// next, handle cases where northern edge of visible window is outside of available data bounds
		if (latN_m>lat[lat.length-1]) idxN=lat.length-1;
		if (latN_m<lat[0]) idxN=miss;
		if (idxN==miss) { return [miss,miss,miss,miss] }

		// WEST INDEX
		var idxW = miss;
		// first, handle cases where western edge of visible window is inside available data bounds
		for (var i=0; i<lon.length-1; ++i) {
			if (lon[i]==lonW_m) {
				idxW = i;
			} else if (lon[i+1]==lonW_m) {
				idxW = i+1;
			} else if (lon[i]<lonW_m && lon[i+1]>lonW_m) {
				idxW = i+1;
			} else {
				idxW = miss;
			}
			if (idxW!=miss) break;
		}
		// next, handle cases where western edge of visible window is outside of available data bounds
		if (lonW_m<lon[0]) idxW=0;
		if (lonW_m>lon[lon.length-1]) idxW=miss;
		if (idxW==miss) { return [miss,miss,miss,miss] }

		// EAST INDEX
		var idxE = miss;
		// first, handle cases where eastern edge of visible window is inside available data bounds
		for (var i=0; i<lon.length-1; ++i) {
			if (lon[i]==lonE_m) {
				idxE = i;
			} else if (lon[i+1]==lonE_m) {
				idxE = i+1;
			} else if (lon[i]<lonE_m && lon[i+1]>lonE_m) {
				idxE = i;
			} else {
				idxE = miss;
			}
			if (idxE!=miss) break;
		}
		// next, handle cases where eastern edge of visible window is outside of available data bounds
		if (lonE_m>lon[lon.length-1]) idxE=lon.length-1;
		if (lonE_m<lon[0]) idxE=miss;
		if (idxE==miss) { return [miss,miss,miss,miss] }

		return [idxS,idxN,idxW,idxE];
	}

	function getContours (cnum) {
		// calculate contour data paths from appropriate contour levels for this grid of data
		// 1. calculate contour levels based on provided data
		// 2. determine contour data paths based on these contour levels. Other tools use these
		//	data paths to construct geojson.

		// find visible indices of grid array
		var bnds = getIndexBounds();

		// if any of the indices are missing, return empty output - no data displayed over map
		if (contains(miss,bnds)) { return [] }

		// slice lat/lon based on indices of visible data
		var lati = grid.lat.pick(null,0).hi(bnds[1]+1).lo(bnds[0]);
		var lonj = grid.lon.pick(0,null).hi(bnds[3]+1).lo(bnds[2]);

		// find max and min values of visible data
		var maxValue = ops.sup(grid.data.hi(bnds[1]+1,bnds[3]+1).lo(bnds[0],bnds[2]));
		var minValue = ops.inf(grid.data.hi(bnds[1]+1,bnds[3]+1).lo(bnds[0],bnds[2]));

		// contour interval
		var step = (maxValue-minValue)/(cnum+1);

		// calculate contour levels
		var clevs = [];
		var smallNum = 1e-3;
		var thisLev = minValue;
		for (var i=0; i<cnum; ++i) {
			thisLev += step;
			// if contour level is an integer, add a small number so that contour
			// level != any grid values. Using conrec method, if a contour level and some
			// grid values are the same, the contour data paths tend to wrap around
			// each grid with those values.
			//if ((thisLev % 1) == 0) {
			//	clevs.push(thisLev+smallNum);
			//} else {
			//	clevs.push(thisLev);
			//}
			// ... staying with unmodified level value for now
			clevs.push(thisLev);
		}

		// calculate contour data paths for these contour levels
		var c = new conrec.Conrec;
		// doesn't work with typed arrays ... but works when typed arrays are unpacked
		c.contour(
			unpack(grid.data.hi(bnds[1]+1,bnds[3]+1).lo(bnds[0],bnds[2])), 
			0, 
			unpack(lati).length-1, 
			0, 
			unpack(lonj).length-1, 
			unpack(lati), 
			unpack(lonj), 
			cnum, 
			clevs
		);
		var output = c.contourList()

		return output
	}

	function contoursToGeojson(cList) {
		// create geojson from contour data paths
		var g = {}
		g["type"] = "FeatureCollection"
		g["features"] = []
		var cidx = 0
		cList.forEach( function(c) {
			cidx += 1
			var thisName = "iso"+cidx.toString()
			var thisIso = {}
			thisIso["type"] = "Feature"
			thisIso["id"] = cidx.toString()
			var coords = []
			c.forEach( function(v) {
				coords.push([v.y,v.x])
			} )
			thisIso["properties"] = {
				"name": thisName,
				"data": c.level
			}
			thisIso["geometry"] = {
				"type": "LineString",
				"coordinates": coords
			}
			g["features"].push(thisIso)
		} )

		return g
	}

	function contourLabels(cList) {
		// handle contour labels
		// 1) clears any currently displayed contour labels,
		// 2) create new labels based on current contour levels,
		//    - labels are placed at the starting point of each contour path.
		// 3) add layer of new labels to map 
		cLabels.clearLayers();
		var cidx = 0
		cList.forEach( function(c) {
			var label = L.marker([c[0].x,c[0].y],{
				icon: L.divIcon({
					className: 'contour-label',
					html: c.level,
					//iconSize: [30,10]
				})
			});
			cLabels.addLayer(label);
		})
		cLabels.addTo(map);

		return false
	}

	function style(feature) {
		// styles for contour lines
		return {
			color: 'black',
			weight: 2,
			opacity: 1.0
		};
	}

	function highlightFeature(e) {
		var layer = e.target;

		layer.setStyle({
			weight: 5,
			color: 'red'
		});

		if (!L.Browser.ie && !L.Browser.opera) {
			layer.bringToFront();
		}

	}

	function resetHighlight(e) {
		var layer = e.target;

		layer.setStyle({
			weight: 2,
			color: 'black',
			opacity: 1.0
		});

		if (!L.Browser.ie && !L.Browser.opera) {
			layer.bringToFront();
		}
	}

	function onEachFeature(feature, layer) {
		layer.on({
			mouseover: highlightFeature,
			mouseout: resetHighlight,
		});
	}

	// create contour data paths, create geojson, and display contour lines
	var cList = getContours(numLevels);
	var isolines = contoursToGeojson(cList);
	var geojson = L.geoJson(isolines, {
		onEachFeature: onEachFeature
	});
	geojson.addTo(map);
	geojson.setStyle(style);

	// create and display contour labels on map
	var cLabels = new L.FeatureGroup();
	contourLabels(cList);

	// update contours after map is moved - new contours are based on visible data
	map.on('moveend', function() {
		var cList = getContours(numLevels);
		var isolines = contoursToGeojson(cList);
		geojson.clearLayers();
		geojson.addData(isolines);
		geojson.setStyle(style);
		contourLabels(cList);
	});

};
