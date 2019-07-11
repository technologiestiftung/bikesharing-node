const config = require('./config.js');
const _ = require('lodash');
const fs = require('fs');
const axios = require('axios');

const { Pool, Client } = require('pg')

// pools will use environment variables
// for connection information

const text = `
SELECT id, "bikeId", "providerId", "timestamp", latitude, longitude
	FROM public."bikeLocations"
	WHERE ("timestamp" >  current_date - INTERVAL '1 day') and ("timestamp" < current_date);
`

const pool = new Pool({
    user: config.db.dbuser,
    host: config.db.dbhost,
    database: config.db.dbname,
    password: config.db.dbpassword,
    port: 5432,
  })

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}

const fetch = async () => {
  // async/await
  try {
    const res = await pool.query(text)
    const filtered = await filter(res.rows);

    let arr = [];

    await asyncForEach(filtered, async (trip) => {
        const routedTrip = await route(trip);

        if (routedTrip != undefined) {
            if (routedTrip.mode == 'mode_trip') {
                arr.push(routedTrip);
            }
        }
    });

    await writeFile('./routed.json', JSON.stringify(arr))

    // await writeFile('./db-response.json', JSON.stringify(filtered));
  } catch(err) {
    console.log(err.stack)
  }
}

const filter = async (data) => {
    let sortedByBikeId = _.orderBy(data, ['bikeId', 'timestamp'], ['asc','asc']);
    const dataLength = sortedByBikeId.length

    let comparedByBikeId = sortedByBikeId.map((bike,i) => {

        if (bike != 'undefined') {

            const nextIndex = i + 1 >= dataLength ? i : i + 1;
    
            const nextLat = sortedByBikeId[nextIndex].bikeId == bike.bikeId ? sortedByBikeId[nextIndex].latitude : null;
            const nextLng = sortedByBikeId[nextIndex].bikeId == bike.bikeId ? sortedByBikeId[nextIndex].longitude : null;
            const endTimestamp = sortedByBikeId[nextIndex].timestamp;
    
            return {
                bikeId: bike.bikeId,
                providerId: bike.providerId,
                mode: bike.latitude != nextLat ? 'mode_trip' : 'mode_accessible',
                timeStamp: bike.timestamp,
                timeStampEnd: sortedByBikeId[nextIndex].bikeId != bike.bikeId ? 'none' : endTimestamp,
                lat: bike.latitude,
                lng: bike.longitude,
                latNext: nextLat,
                lngNext: nextLng,
            }
        }

    })

    return comparedByBikeId;

}

// extract waypoints, duration, length of routed trip
const route = async (obj) => {

    try {
        let latStart = obj.lat;
        let lngStart = obj.lng;
    
        let latEnd = obj.latNext;
        let lngEnd = obj.lngNext;

        obj.wps = null;
        obj.distance = null;
        obj.duration = null;
    
        let local = `http://127.0.0.1:5000/route/v1/bicycle/${lngStart},${latStart};${lngEnd},${latEnd}?geometries=geojson`
        let url = `${config.routerUrl}/route/v1/bicycle/${lngStart},${latStart};${lngEnd},${latEnd}?geometries=geojson`
    
        const r = await axios(local);

        obj.wps = r.data.routes[0].geometry.coordinates;
        obj.distance = r.data.routes[0].distance;
        obj.duration = r.data.routes[0].duration;

        return obj;

    } catch (e) {
        // console.log(e);
    }

}

const writeFile = async (pathAndFilename, body) => {
    fs.writeFileSync(pathAndFilename, body);
}

// fetch data from current day from postgres db
fetch();










