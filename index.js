const express = require('express');
const cors = require('cors');
const request = require('request');
const app = express();
const PORT =  8100;
const USER = process.env.AIRBUS_USER || '';
const PASSWORD = process.env.AIRBUS_PASS || '';
app.use(cors({origin: true, credentials: true}));

app.get('/search' , (req, res) => {
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
    request(options, (err,response, body)=> {
        if(err) res.status(response? response.statusCode : 500).send(err.message);
        else{
            res.send(body);
        }
    });

});


app.get('/xyz' , (req, res)=>{
    let {original } = req.query;
    original = original.replace('https://tiles.airbusds-geo.com/' , 'https://tiles.airbusds-geo.com/basic/');
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


app.listen(PORT, () => console.log('listening ' , PORT));
