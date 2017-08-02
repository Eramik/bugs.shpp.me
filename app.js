'use strict';
const express = require('express'),
    fs = require('fs'),
    Jimp = require("jimp"),
    crypto  = require('crypto'),
    myip = 'http://bugs.shpp.me/',
    app = express(),
    port = 3013,
    imgPath = 'artwork/',
    localImgPath = 'public_html/' + imgPath,
    imgBasePath = myip + 'base.png',
    imgExt = '.png',
    resDir = 'public_html/results/',
    bodyParser = require('body-parser');

const public_key = 'i93700517986';
const private_key = 'Q8a8PkE9ZUVizQA5bxeTAkoRYlQbLqEiUXq9nrLG';

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(function (req, res, next) {
    if (req.method === 'OPTIONS') {
        let headers = {};
        headers["Access-Control-Allow-Origin"] = "*";
        headers["Access-Control-Allow-Methods"] = "POST, GET, PUT, DELETE, OPTIONS";
        headers["Access-Control-Allow-Credentials"] = false;
        headers["Access-Control-Max-Age"] = '86400'; // 24 hours
        headers["Access-Control-Allow-Headers"] = "x-access-token, X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept";
        res.writeHead(200, headers);
        res.end();
    } else {
        res.header("Access-Control-Allow-Origin", "*");
        next();
    }
});

// f(n, M[:], k, A[:]) = M[0] * f(n - 1, M[1:], k - 1, A[1:]) + f(n - 1, M[1:], k, A[1:]);
// Total combinations count
function f(n, k, M, i) {
    return  (i === n && k > 0) ? 0
        :(i === n) ? 1
            :M[i] * f(n, k - 1, M, i + 1) + f(n, k, M, i + 1);
}

app.get('/images', (req, res)=>{
    let r = {
        categories: [],
        total_combinations: 0
    };
    let categories = fs.readdirSync(localImgPath);
    for(let i = 0; i < categories.length; i++) {
        for (let j = 0; j < categories.length - i - 1; j++) {
            if (categories[j][0] > categories[j + 1][0]) {
                let t = categories[i];
                categories[i] = categories[j];
                categories[j] = t;
            }
        }
    }
    let n = categories.length;
    let m = [];
    categories.forEach((c, i) => {
        let catPath = localImgPath + c + '/';
        r.categories[i] = {
            id: imgPath + c + '/',
            name: c.substr(2, c.length),
            images: fs.readdirSync(catPath)
        };
        m.push(r.categories[i]["images"].length);
        r.categories[i]["images"].forEach((img, ix)=>{
            let imgName = img.replace('_', ' ');
            imgName = imgName.replace(/\.[^/.]+$/, "");
            let id = r.categories[i]["id"] + img;
            let href = myip + id;
            r.categories[i]["images"][ix] = {
                name: imgName,
                id: r.categories[i]["id"]+img,
                href: href,
                thumbnail_href: href
            };
        })
    });
    r["total_combinations"] = f(n, 3, m, 0);
    res.json(r);
});

let imgBase;
function clearBase() {
    Jimp.read(imgBasePath, (err, image) => {
        imgBase = image;
        console.log("base read");
    });
}
clearBase();

function readFirstComponent(components, callback) {
    if(components.length === 0) { callback(); return;}
    let el =encodeURI( myip + components.shift());
    Jimp.read(el, (err, adding) => {
        imgBase.composite(adding, 0, 0);
        readFirstComponent(components, callback);
    });
}

app.post('/render', (req, res) =>{
    console.log(req.body);
    let components = req.body['selected[]'];
    console.log("new render request");
    readFirstComponent(components, ()=>{
        let name = req.body.resultname;
        let imgName = resDir + name + imgExt;
        imgBase.write(imgName, ()=>{
            clearBase();
        });
    });
    res.send(':)');
});

app.post('/callback', (req, res)=>{
    console.log(req.body);
    const data = req.body.data;
    const signature = req.body.signature;
    let sha1 = crypto.createHash('sha1');
    sha1.update(private_key + data + private_key);
    sha1 = sha1.digest('base64');
    if(sha1 === signature)
        console.log("successfully paid");
    else
        console.log("payment failed");
    res.send()
});

app.post('/pay', (req, res)=>{
    console.log('pay post request');
    const result_url = req.body.result_url;
    const amount = req.body.amount;
    const orderid = req.body.resultname;
    console.log(req.body);
    const data = {
        'public_key'     : public_key,
        'action'         : 'pay',
        'amount'         : amount,
        'currency'       : 'UAH',
        'description'    : 'Оплата за користування послугами сервісу bugs.shpp.me',
        'order_id'       : 'order_id_' + orderid,
        'version'        : '3',
        'server_url'     : 'http://bugs.shpp.me:3013/callback',
        'sandbox'        : '1',
        'result_url'     : result_url
    };
    let r = {};
    r['DATA'] = new Buffer(JSON.stringify(data)).toString("base64");
    let sha1 = crypto.createHash('sha1');
    sha1.update(private_key + r['DATA'] + private_key);
    r['SIGNATURE'] = sha1.digest('base64');
    res.write(JSON.stringify(r));
    res.end();
});

app.get('/download', (req, res)=>{
    let imgID = resDir + req.query.resultname + imgExt;
    let img = fs.readFileSync(imgID);
    res.writeHead(200, {'Content-Type': 'image/gif' });
    res.end(img, 'binary');
});

app.listen(port, function () {
    console.log('Server listening at port %d', port);
});
