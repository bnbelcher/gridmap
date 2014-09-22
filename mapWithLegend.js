module.exports = function (args) {

	// extract variables from input
	map = args['map']
	data = args['geojsonData']
	colorRange = args['colorRange']
	header = args['header']
	legendType = args['legendType']
	numLevels = colorRange.length

	function getColor(d) {
		color = colorRange[numLevels-1];
		for (var i = 0; i < levels.length; i++) {
			if (d<=levels[i]) {
				color = colorRange[i];
				break;
			}
		}
		return color
	}

	function style(feature) {
		if (feature.geometry.type=='Point') {
			return {
				radius: 6,
				fillColor: getColor(feature.properties.data),
				color: 'white',
				weight: 1,
				opacity: 0.7,
				fillOpacity: 0.7
			};
		} else {
			return {
				weight: 2,
				opacity: 0.7,
				color: 'white',
				dashArray: '3',
				fillOpacity: 0.7,
				fillColor: getColor(feature.properties.data)
			};
		}
	}

	function highlightFeature(e) {
		var layer = e.target;

		layer.setStyle({
			weight: 5,
			color: '#666',
			dashArray: '',
			fillOpacity: 0.7
		});

		if (!L.Browser.ie && !L.Browser.opera) {
			layer.bringToFront();
		}

		legend.update(layer.feature.properties);
	}

	function resetHighlight(e) {
		var layer = e.target;

		layer.setStyle({
			weight: 2,
			color: 'white',
			dashArray: '3',
			fillOpacity: 0.7
		});

		if (!L.Browser.ie && !L.Browser.opera) {
			layer.bringToFront();
		}

		legend.update();
	}

	function zoomToFeature(e) {
		map.fitBounds(e.target.getBounds());
	}

	function onEachFeature(feature, layer) {
		if (legendType==2) {
			layer.on({
				mouseover: highlightFeature,
				mouseout: resetHighlight,
				click: function() {
						if (feature.geometry.type!='Point') {
							return zoomToFeature
						} else {
							return null
						}
					}
			});
		}
	}

	var geojson = L.geoJson(data, {
		pointToLayer: function (feature, latlng) {
			if (feature.geometry.type=='Point') {
				return L.circleMarker(latlng);
			} else {
				return null;
			}
		},
		onEachFeature: onEachFeature
	});
	var levels = getMapLevels(numLevels);

	// fit bounds to available data, regardless of user 'setView' settings.
	map.fitBounds(geojson.getBounds());
	geojson.setStyle(style);
	geojson.addTo(map);

	// control that updates legend every time map window is changed
	var legend = L.control({position: 'bottomright'});

	legend.onAdd = function (map) {
		this._div = L.DomUtil.create('div', 'info legend');
		this.update();
		return this._div;
	};

	function getDataRange() {
		// construct an empty list to fill with onscreen data
		var inBounds = [],
		// get the map bounds
			bounds = map.getBounds();

		// for each polygon, consider whether it is currently visible by comparing
		// with the current map bounds. For visible polygons, save data to array.
		geojson.eachLayer(function(layer){
			if (layer.feature.geometry.type=='Point') {
				if (bounds.contains(layer.getLatLng())) {
					inBounds.push(layer.feature.properties.data);
				}
			} else {
				if (bounds.intersects(layer.getLatLngs())) {
					inBounds.push(layer.feature.properties.data);
				}
			}
		});

		// update the legend if polygons are in view
		if (inBounds.length>1) {
			// Find minimum and maximum values inside bounds
			var dataMin = Math.min.apply(Math, inBounds);
			var dataMax = Math.max.apply(Math, inBounds);
		} else if (inBounds.length==1) {
			var dataMin = inBounds[0];
			var dataMax = inBounds[0];
		} else {
			var dataMin = null;
			var dataMax = null;
		}

		return [dataMin,dataMax];

	}

	function getMapLevels(numLevels) {
		var levels = []
		// range of data
		dataRange = getDataRange();
		// shading/contour interval
		if (dataRange[0] && dataRange[1]) {
			if (dataRange[1]-dataRange[0]!=0) {
				var interval = (dataRange[1] - dataRange[0])/(numLevels-1)
				for (var i = dataRange[0]+(interval/2); i <= dataRange[1]; i += interval) {
					levels.push(Math.round(i));
				}
			} else {
				levels.push(Math.round(dataRange[0]));
			}
		} else {
			levels.push(null);
		}
		return levels;
	}

	legend.update = function(props) {
		var labels = [],
			from, to;

		legendTop = '<h4><b>'+header+'</b></h4>';

		if (levels.length!=1) {
			labels.push(
				(props ? 
					(props.data<=levels[0] ?
						'<i style="background:' + getColor(levels[0]-1) + '">'+props.data+'</i> ' +
						'<b>&le; '+levels[0]+'</b>'
					:
						'<i style="background:' + getColor(levels[0]-1) + '"></i> ' +
						'&le; '+levels[0])
				:
					'<i style="background:' + getColor(levels[0]-1) + '"></i> ' +
					'&le; '+levels[0])
				);

			for (var i = 0; i < levels.length; i++) {
				from = levels[i];
				to = levels[i + 1];

				labels.push(
					(props ? 
						(to ? 
							(props.data>from && props.data<=to ?
								'<i style="background:' + getColor(from + 1) + '">'+props.data+'</i> ' +
								'<b>' + (to ? from+'&ndash;'+to : '&gt; '+from)+'</b>'
							:
								'<i style="background:' + getColor(from + 1) + '"></i> ' +
								(to ? from+'&ndash;'+to : '&gt; '+from))
						:
							(props.data>from ?
								'<i style="background:' + getColor(from + 1) + '">'+props.data+'</i> ' +
								'<b>&gt; '+from+'</b>'
							:
								'<i style="background:' + getColor(from + 1) + '"></i> ' +
								'&gt; '+from))
					:
						'<i style="background:' + getColor(from + 1) + '"></i> ' +
						(to ? from+'&ndash;'+to : '&gt; '+from))
				);
			}
		}
		else {
			if (!levels[0]) {
				labels.push('');
			}
			else {
				labels.push(
					(props ?
						(props.data==levels[0] ?
							'<i style="background:' + getColor(levels[0]) + '">'+props.data+'</i> ' +
							levels[0]
						:
							'<i style="background:' + getColor(levels[0]) + '"></i> ' +
							levels[0])
					:
						'<i style="background:' + getColor(levels[0]) + '"></i> ' +
						levels[0])
				);
			}
		}

		this._div.innerHTML = legendTop + labels.join('<br>');
	};

	legend.addTo(map);

	// update legend when map is moved
	if (legendType) {
		map.on('move', function() {
			// Update map colors and legend for visible data
			levels = getMapLevels(numLevels);
			geojson.setStyle(style);
			legend.update();
		});
	}

};
