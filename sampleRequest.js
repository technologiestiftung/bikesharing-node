const config = require('./config.js');
const fs = require('fs');
const helpers = require('./modules/helpers.js')(config);
const here = require('./modules/here.js')(config);
const turf = require('@turf/distance');
const turfHelpers = require('@turf/helpers');

const d3 = require('d3');

// Step 1: Transform csv to aggregated json
// const csv = helpers.loadCsv(config.dataPath);

// Step 2: aggregate transformed json
// const json = helpers.createTrips('./data_by_bike.json');

// Scrape geojsons based on 
// const json = helpers.loadJSON('data.json');
// generateGeoJSON('12-4', 0);

// Step 3: Generate Trips

generateTripsJSON('data_trips_by_bike.json');

// console.log(helpers.getMilliseconds("2019-04-13 23:56:02.992021"));
// console.log(helpers.getMilliseconds("2019-04-12 00:00:05.777981"));

async function generateTripsJSON(path) {

    fs.writeFileSync('data_routed_by_trips.json', '[');
    
    var json = JSON.parse(fs.readFileSync(path));
    let result = [];
    let first = false;
    const providers = [0,1,2];
    let linearTimeScale;
    let numRouteWaypoints;
    let a;

    const timeFirst = 1555020005777;
    const timeLast = 1555192562992;
    const duration = timeLast - timeFirst;
    
    linearTimeScale = d3.scaleLinear()
        .domain([timeFirst, timeLast])
        .range([0, 99999])
    
    providers.forEach((provider) => {
        var bikesArr = json[provider];

        bikesArr.forEach(async (bike,bikeIndex) => {
    
            var waypoints = bike.trip;
            var timestamps = bike.timestamp;
                
            a = await here.routing(waypoints); 
                
            if (typeof a !== 'undefined') {
                a = JSON.parse(a);
                
                if (a.response != undefined) {

                    var from = turfHelpers.point(waypoints[0]);
                    var to = turfHelpers.point(waypoints[1]);

                    var options = {units: 'kilometers'};
                                
                    var distance = turf.default(from, to, options);
                    distance = distance * 1000;

                    // console.log('distance', distance, 'meters');

                    if (distance > 1000) {

                        const bikeObj = {
                            vendor: provider,
                            segments: []
                        }
                        
                        bikeObj.segments.push(
                            [
                                parseFloat(waypoints[0][0]), 
                                parseFloat(waypoints[0][1]),
                                timestamps[0]
                            ]
                        )

                        // each leg is the line between two waypoints
                        a.response.route[0].leg.forEach(function(leg, wpIndex) {

                            numRouteWaypoints = leg.shape.length - 1;

                            // 
                            // calculate distances between routed waypoints to get right amount of time passed by. !!!!!
                            //
                            
                            let distanceTotal = 0;
                            let _distances = [];

                            // calculate _distances for returned locations between start and end location
                            leg.shape.forEach(function(pnt, i) {
                                if (i > 0) {
                                    const coordsFrom = hereStringToCoords(leg.shape[i - 1]);
                                    const coordsTo = hereStringToCoords(pnt);

                                    var from = turfHelpers.point(coordsFrom);
                                    var to = turfHelpers.point(coordsTo);
                                    var options = {units: 'kilometers'};
                                    
                                    var distance = turf.default(from, to, options);
                                    distanceTotal += distance;
                                    _distances.push(distanceTotal);
                                }
                            })

                            const interpolateTime = d3.scaleLinear()
                                .domain([0, distanceTotal])
                                .range([timestamps[0], timestamps[1]])
                                
                            const tripDuration = timestamps[1] - timestamps[0];                             

                            leg.shape.forEach(function(pnt, i) {

                                if (i > 0) {
                                    // interpolate returned route parts into miliseconds
        
                                    var coords = hereStringToCoords(pnt);
    
                                    bikeObj.segments.push(
                                        [
                                            coords[0], 
                                            coords[1],
                                            Number((interpolateTime(_distances[i - 1]).toFixed(0)))
                                        ]
                                    )
                                }
                            });
                        });

                        bikeObj.segments.push(
                            [
                                parseFloat(waypoints[waypoints.length - 1][0]), 
                                parseFloat(waypoints[waypoints.length - 1][1]),
                                timestamps[1]
                            ]
                        )

                        bikeObj.segments.forEach(segment => {
                            const interpolated = Number((linearTimeScale(segment[2])).toFixed(1));
                            segment[2] = interpolated;
                        })

                        var dir = `data/`;
                        var filename = bike.bikeId  + ".json";  

                        helpers.writeFile(filename, dir, JSON.stringify(bikeObj));

                        fs.appendFileSync('data_routed_by_trips.json', `${(first) ? ',' : ''}${JSON.stringify(bikeObj)}`);
                        console.log(bikeIndex, 'of', bikesArr.length);
                        console.log(a.response);
                        first = true;
                    }
                }
            }
        })
    })
    fs.appendFileSync('data_routed_by_trips.json', `]`);
    console.log('finished');
}


function generateGeoJSON(day, provider) {
    var json = JSON.parse(fs.readFileSync('data.json'));
    var bikesArr = json[provider][day].slice(0,2); // remove slice later
    var unmoved = [];

    bikesArr.forEach(bike => {
        var waypoints = bike.waypoints;

        if (waypoints.length >= 2) {

            here.routing(waypoints, function(a) {
    
                if (typeof a !== 'undefined') {

                    a = JSON.parse(a);
                    
                    if (a.response != undefined) {
                
                        var dflt = JSON.parse(fs.readFileSync('defaults/linestring.geojson', 'utf8'));
                
                        dflt.geometry.coordinates.push( 
                            [
                                parseFloat(waypoints[0][0]), 
                                parseFloat(waypoints[0][1])
                            ]
                        )
                        
                        // each leg is the line between two waypoints
                        a.response.route[0].leg.forEach(function(leg) {
                            leg.shape.forEach(function(pnt) {
                                var coords = hereStringToCoords(pnt);
                                dflt.geometry.coordinates.push(coords);
                            });
                        });
                
                        dflt.geometry.coordinates.push( 
                            [
                                parseFloat(waypoints[waypoints.length - 1][0]), 
                                parseFloat(waypoints[waypoints.length - 1][1])
                            ]
                        )
                
                        var dir = `data/routes/${provider}/${day}/`;
                        var filename = bike.bikeId  + ".geojson";
                
                        helpers.writeFile(filename, dir, JSON.stringify(dflt));

                    }
                    
            
                }
            });
        } else {
            unmoved.push(waypoints);
        }
    })

    var dir = `data/routes/${provider}/${day}/`;
    var filename = "_unmoved.json";

    helpers.writeFile(filename, dir, JSON.stringify(unmoved));

    console.log('finished!');
}


function hereStringToCoords(hs) {
    var arr = hs.split(",");
    return [ parseFloat(arr[1]) , parseFloat(arr[0]) ];
}