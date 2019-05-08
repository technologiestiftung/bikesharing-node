const config = require('./config.js');
const fs = require('fs');
const helpers = require('./modules/helpers.js')(config);
const here = require('./modules/here.js')(config);

const waypoints = [
    [
        "13.341193",
        "52.532207"
    ],
    [
        "13.341556",
        "52.53198"
    ],
    [
        "13.330225",
        "52.525356"
    ],
    [
        "13.3414123",
        "52.5322039"
    ]
]

// const csv = helpers.loadCsv(config.dataPath);

const json = helpers.loadJSON('data.json');
const tt = 'test';


here.routing(waypoints, function(a) {

    if (typeof a !== 'undefined') {

        a = JSON.parse(a);

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

        var dir = 'data/routes/';
        var filename = tt  + ".geojson";

        helpers.writeFile(filename, dir, JSON.stringify(dflt));

    }
});


function hereStringToCoords(hs) {
    var arr = hs.split(",");
    return [ parseFloat(arr[1]) , parseFloat(arr[0]) ];
}