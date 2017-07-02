'use strict';
let express = require('express'),
    fs = require('fs'),
    myip = 'http://bugs.shpp.me',
    app = express(),
    port = 3013,
    imgPath = 'artwork/';

app.use(function (req, res, next) {
    if (req.method === 'OPTIONS') {
        console.log('!OPTIONS');
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


app.get('/images', (req, res)=>{
    let r = {categories: []};
    let categories = fs.readdirSync(imgPath);

    for(let i = 0; i < categories.length; i++){
	for(let j = 0; j < categories.length - i - 1; j++){    
	    if(categories[j][0] > categories[j+1][0]) {
        	    let t = categories[i];
	            categories[i] = categories[j];
        	    categories[j] = t;
	        }
	}
    }
   
    categories.forEach((c, i) => {
        let catPath = imgPath + c + '/';
        c = c.substr(2, c.length);
        r.categories[i] = {
            id: catPath,
            name: c,
            images: fs.readdirSync(catPath)
        };
    
        r.categories[i]["images"].forEach((img, ix)=>{
            let imgName = img.replace('_', ' ');
            imgName = imgName.replace(/\.[^/.]+$/, "");
            let id = r.categories[i]["id"]+img;
            let href = myip + '/' + id;
            r.categories[i]["images"][ix] = {
                name: imgName,
                id: r.categories[i]["id"]+img,
                href: href,
                thumbnail_href: href
            };
        })
    });
    res.json(r);
});


app.listen(port, function () {
    console.log('Server listening at port %d', port);
});
