// const config = require('./config.js');
const fs = require('fs');
const axios = require('axios');
const here = require('./modules/here.js')(config);

// ToDo:
// implement open street map routing
// store distanc and speed in data

const path = "https://fdnklg.uber.space/scripts/bike-sharing/2019-6-17.json";



const getTimeRange = (data) => {
    let oldest = data[0].timestamp;
    let newest = data[0].end_timestamp;

    data.forEach((trip,i) => {

        if (trip.timestamp < oldest) {
            oldest = trip.timestamp;
        }

        if (trip.timestamp > newest) {
            newest = trip.timestamp;
        }
    })

    return [oldest, newest];
}



const fetchData = (url) => {
    axios.get(url)
        .then((res) => {
            const trips = res.data;
            const timeRangeArr = getTimeRange(trips);

            console.log(timeRangeArr);

            try {
                fs.writeFileSync('./data_routed_by_trips.json', '["working!!!"');
                fs.appendFileSync('./data_routed_by_trips.json', `]`);
            } catch(err) {
                // An error occurred
                console.error(err);
            }


            console.log('file written!');
        })
        .catch(error => {
            console.log(error.response)
        });
}



fetchData(path);