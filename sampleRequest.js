const config = require('./config.js');
const fs = require('fs');
const helpers = require('./modules/helpers.js')(config);
const here = require('./modules/here.js')(config);

// const csv = helpers.loadCsv(config.dataPath);

// Scrape geojsons based on 
const json = helpers.loadJSON('data.json');
generateGeoJSON('13-4', 2);

function generateGeoJSON(day, provider) {
    var json = JSON.parse(fs.readFileSync('data.json'));
    var bikesArr = json[provider][day]; // remove slice later
    var unmoved = [];

    bikesArr.forEach(bike => {
        var waypoints = bike.waypoints;

        if (waypoints.length >= 2) {

            here.routing(waypoints, function(a) {
    
                if (typeof a !== 'undefined') {

                    a = JSON.parse(a);
                    
                    if (a.response != undefined) {
                        

                        console.log(a.response);
                
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