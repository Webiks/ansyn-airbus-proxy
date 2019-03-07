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
    const {_id } = req.query;
    if(_id) {
        const options = {
            uri: `https://tiles.airbusds-geo.com/basic/metadata/${req.query._id}`,
            json: true,
            auth: {
                user: USER,
                pass: PASSWORD,
                sendImmediately: false
            }
        };
        request(options, (err, resp, body) => {
            const keys = ['UID', 'nBits', 'wmtsUrl', 'cloudCover', 'orientationAngle', 'centerCol', 'radiometricAdjustment',
                'gsUri', 'constellation', 'viewingAngle', 'snowCover', 'dataFileFormat', 'centerRow', 'nCols', 'viewingAlongTrack', 'illuminationAzimuthAngle',
                'gsdAlongTrack', 'nRows', 'instrument', 'gsdAcrossTrack', 'passDirection', 'centerLatitude', 'satellite', 'illuminationElevationAngle',
                'acquisitionDate', 'viewingAcrossTrack', 'lastModifiedDate', 'provider', 'crsCode', 'tileEngineUrl', 'incidenceAngle', 'sourceId',
                'incidenceAcrossTrack', 'spectralProcessing', 'processingLevel', 'centerLongitude', 'nBands', 'incidenceAlongTrack', 'resolution', 'Geometry'];
            let $ = cheerio.load(body);
            const overlay = {};
            //{"type":"Polygon","orientation":"clockwise","coordinates":[[[1.135122685185185,43.77625694444444],[1.398576388888888,43.77625694444444],[1.398576388888888,43.38513657407407],[1.135122685185185,43.38513657407407],[1.135122685185185,43.77625694444444]]]}
            $('dt').each((i, el) => {
                const key = $(el).text().trim();
                if (keys.includes(key)) {
                    const value = $(el).next().text().trim();
                    overlay[key] = value;
                }
            });

            res.json({
                id: overlay.UID, properties: overlay, geometry: {
                    type: 'Polygon', orientation: 'clockwise', coordinates: JSON.parse(overlay.Geometry)
                }
            });

        })
    }else{
        res.status(500).json({error: 'must pass _id parameter'})
    }
});

app.get('/search', (req, res) => {
    const { bbox, start, end } = req.query;
    let query = `?bbox=${bbox}`;
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
            const startDate = new Date(start).getTime();
            const endDate = new Date(end).getTime();
            const toUser = {error: body.error,
                features: body.features.filter( (feature) => {
                    const date = new Date(feature.properties.acquisitionDate).getTime();
                    return date > startDate && date < endDate;
                })
            };
            res.json(toUser);
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
