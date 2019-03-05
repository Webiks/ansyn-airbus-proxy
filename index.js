const express = require('express');
const cors = require('cors');
const request = require('request');
const cheerio = require('cheerio');
const app = express();

const PORT = 8100;
const USER = process.env.AIRBUS_USER || '';
const PASSWORD = process.env.AIRBUS_PASS || '';
app.use(cors({ origin: true, credentials: true }));

app.get('/', (req, res) => {
    console.log('req.', req.query);
    const options = {
        uri: `https://tiles.airbusds-geo.com/basic/metadata/${req.query.id}`,
        json: true,
        auth: {
            user: USER,
            pass: PASSWORD,
            sendImmediately: false
        }
    };
    request(options, (err, resp, body) => {
        const keys = ['UID', 'nBits','wmtsUrl','cloudCover','orientationAngle','centerCol','radiometricAdjustment',
            'gsUri','constellation','viewingAngle','snowCover','dataFileFormat','centerRow','nCols','viewingAlongTrack','illuminationAzimuthAngle',
            'gsdAlongTrack','nRows','instrument','gsdAcrossTrack','passDirection','centerLatitude','satellite','illuminationElevationAngle',
            'acquisitionDate','viewingAcrossTrack','lastModifiedDate','provider','crsCode','tileEngineUrl', 'incidenceAngle', 'sourceId',
            'incidenceAcrossTrack', 'spectralProcessing', 'processingLevel', 'centerLongitude', 'nBands', 'incidenceAlongTrack', 'resolution','Geometry'];
        let $ =cheerio.load(body);
        const overlay = {};
        //{"type":"Polygon","orientation":"clockwise","coordinates":[[[1.135122685185185,43.77625694444444],[1.398576388888888,43.77625694444444],[1.398576388888888,43.38513657407407],[1.135122685185185,43.38513657407407],[1.135122685185185,43.77625694444444]]]}
        $('dt').each( (i, el) => {
            const key = $(el).text().trim();
            console.log(`searching... ${key}`);
            if(keys.includes(key)) {
                const value = $(el).next().text().trim();
                console.log(`key: ${key} , value: ${value}`);
                overlay[key] = value;
            }
        });



        res.json({id: overlay.UID, properties: overlay, geometry: {
            type: 'Polygon', orientation: 'clockwise', coordinates: JSON.parse(overlay.Geometry)
            }});
    })
});

app.get('/search', (req, res) => {
    let query = '?';
    Object.entries(req.query).forEach(q => {
        console.log(q);
        query = query.concat(`${q[0]}=${q[1]}`)
    });
    const options = {
        uri: `https://tiles.airbusds-geo.com/basic/search${query}`,
        json: true,
        auth: {
            user: USER,
            pass: PASSWORD,
            sendImmediately: false
        }
    };
    request(options, (err, response, body) => {
        if (err) res.status(response ? response.statusCode : 500).send(err.message);
        else {
            res.send(body);
        }
    });

});

app.get('/xyz', (req, res) => {
    let { original } = req.query;
    original = original.replace('https://tiles.airbusds-geo.com/', 'https://tiles.airbusds-geo.com/basic/');
    console.log('request tile : ' + original);
    const opt = {
        uri: original,
        auth: {
            user: USER,
            pass: PASSWORD,
            sendImmediately: false
        }
    };
    let img = request(opt);
    req.pipe(img);
    img.pipe(res);
});


app.listen(PORT, () => console.log('listening ', PORT));
