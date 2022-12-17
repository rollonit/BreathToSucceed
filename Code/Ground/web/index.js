const express = require('express');
const sqliteJson = require('sqlite-json');

const exporter = sqliteJson('../db/airData.db');

const app = express();
const port = 8000;

// Pointing the app towards the directory to serve for static files
app.use(express.static('public'));

app.use(express.json());

//Handles API requests here when url is /data
app.get('/data', (req, res) => {
    exporter.json({ table: 'airQuality' }, (err, json) => {
        if (err) {
            console.error(err.message);
        }
        //Output the parsed JSON from SQL.
        res.status(200).json(JSON.parse(json));
    });
});

//Handles API requests here when url is /data
app.get('/latest', (req, res) => {
    exporter.json('SELECT * FROM airQuality ORDER BY timecode DESC LIMIT 1;', (err, json) => {
        if (err) {
            console.error(err.message);
        }
        //Output the parsed JSON from SQL.
        res.status(200).json(JSON.parse(json));
    });
});

//Handles API requests here when url is /data
app.post('/data', (req, res) => {
    if (Number.isInteger(req.body.timeStart) && Number.isInteger(req.body.timeEnd))
        exporter.json({ table: 'airQuality', where: `timecode > ${req.body.timeStart}`, where: `timecode < ${req.body.timeEnd}` }, (err, json) => {
            if (err) {
                console.error(err.message);
            }
            //Output the parsed JSON from SQL.
            res.status(200).json(JSON.parse(json));
        });
    else
        res.status(404).end("NOT FOUND! Please check request headers (they need to have Content-Type of application/json) and your params (you need to have a timeStart and timeEnd, both int in a JSON).");
});

// Telling the app to listen for get requests on the given port.
app.listen(port, () => {
    console.log(`WebServ app listening on port ${port}`);
});
