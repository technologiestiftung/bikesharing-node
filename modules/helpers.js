const fs = require("fs");
const _ = require('lodash');
const csv = require("csv-parser");
const mkdirpSync = require('mkdirpSync');

module.exports = (config) => {
    let module = {};

    module.loadCsv = (pathToCsv) => {
        let results = [];
        fs.createReadStream(pathToCsv)
            .pipe(csv())
            .on('data', data => { results.push(data) })
            .on('end', () => {
                module.aggregate(results);
            })
    }

    module.aggregate = (data) => {
        const uniqueBikes = [];

        const transformed = {
            0: {
                '12-4': [],
                '13-4': [],
                '14-4': [],
            },
            1: {
                '12-4': [],
                '13-4': [],
                '14-4': [],
            },
            2: {
                '12-4': [],
                '13-4': [],
                '14-4': [],
            },
        };
        
        for (let index = 0; index < data.length; index++) {
            const element = data[index];
            module.compareRows(transformed, element)  // enable later again!
        }



        fs.writeFileSync('data.json', JSON.stringify(transformed));
        console.log('finished!')
    }

    module.compareRows = (array, object) => {
        const posInArr = array[object.providerId][module.formatDate(object.timestamp)]
        const found = _.find(posInArr, { 'bikeId': object.bikeId });
        
        if (found == undefined) {
            posInArr.push({
                bikeId: object.bikeId,
                waypoints: []
            });
        } else if (found != undefined) {

            // swap lat & lng for two providers
            if (object.providerId == 0 || object.providerId == 2) {

                if (found.waypoints.length > 0) {
                    const lastWaypoint = found.waypoints[found.waypoints.length - 1];
                    if (lastWaypoint[0] != object.longitude) {
                        found.waypoints.push([object.longitude, object.latitude]);
                    }
                } else if (found.waypoints.length == 0) {
                    found.waypoints.push([object.longitude, object.latitude]);
                }

            } else {

                if (found.waypoints.length > 0) {
                    const lastWaypoint = found.waypoints[found.waypoints.length - 1];
                    if (lastWaypoint[0] != object.latitude) {
                        found.waypoints.push([object.latitude, object.longitude]);
                    }
                } else if (found.waypoints.length == 0) {
                    found.waypoints.push([object.latitude, object.longitude]);
                }

            }

        }
    }

    module.swapItems = (data) => {
        const days = ['12-4', '13-4', '14-4'];

        days.forEach(day => {
            data[0][day].forEach((bike) => {
                
            })
        })
    }

    module.formatDate = (elm) => {
        const dateStr = `${new Date(elm).getDate()}-${parseInt(new Date(elm).getMonth()) + 1}`;
        return dateStr;
    }

    module.loadJSON = (pathToJSON) => {
        let json;
        fs.readFile(pathToJSON, (err, data) => {
            json = JSON.parse(data);
        })
    }


    module.writeFile = function(filename, dir, body) {

        if (!fs.existsSync(dir)) { mkdirpSync(dir); }
        fs.writeFileSync(dir + filename, body);

    }



    return module;
}