const fs = require('fs');
const request = require('request');

module.exports = (config) => {
    let module = {};

    module.routing = (coords, callback) => {

        var mode = "fastest;bicycle";

        var waypoints = coordArrayToWPList(coords);

        var url = config.here.routingUrl +
                  "?app_id=" + config.here.appID +
                  "&app_code=" + config.here.appCode +
                  waypoints +
                  //"&waypoint0=" + coordsToWP(wp0) +
                  //"&waypoint1=" + coordsToWP(wp1) +
                  "&mode=" + mode +
                  "&representation=turnByTurn";

        var opt = module.buildHEREOpt(url);

        request(opt, function (error, response, body) {
            callback(body);
        });
    }

    module.buildHEREOpt = function(url) {
        var opt = {
            headers: {
                "Accept": "application/json"
            }
        };
        opt.url = url;
        return opt;
    }

    function coordArrayToWPList(ca) {
        var ret = "";
        ca.forEach(function(entry, index) {
            ret += "&waypoint" + index + "=" + coordsToWP(entry);
        });
        return ret;
    }

    function coordsToWP(coords) {
        return "geo!" + coords[1] + "," + coords[0];
    }

    return module;
}

