const express = require("express"),
    fs = require("fs"),
    Jimp = require("jimp"),
    crypto = require("crypto"),
    bodyParser = require("body-parser");

const conf = require("./config");

const app = express();

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.use(function (req, res, next) {
    if (req.method === "OPTIONS") {
        let headers = {};
        headers["Access-Control-Allow-Origin"] = "*";
        headers["Access-Control-Allow-Methods"] = "POST, GET, PUT, DELETE, OPTIONS";
        headers["Access-Control-Allow-Credentials"] = false;
        headers["Access-Control-Max-Age"] = "86400"; // 24 hours
        headers["Access-Control-Allow-Headers"] = "x-access-token, X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept";
        res.writeHead(200, headers);
        res.end();
    } else {
        res.header("Access-Control-Allow-Origin", "*");
        next();
    }
});

/**
 * Calculate total combinations amount with some restrictions
 * using this formula:
 * f(n, M[:], k, A[:]) = M[0] * f(n - 1, M[1:], k - 1, A[1:]) + f(n - 1, M[1:], k, A[1:]);
 *
 * @param n - amount of item types
 * @param k - min amount of items to be selected
 * @param M - array of items to process
 * @param i - current element that is processed and calculated
 * @returns {number} - total combinations amount
 */
function f(n, k, M, i = 0) {
    return (i === n && k > 0) ? 0
        : (i === n) ? 1
            : M[i] * f(n, k - 1, M, i + 1) + f(n, k, M, i + 1);
}

app.get("/images", (req, res) => {
    let r = {
        categories: [],
        total_combinations: 0
    };

    // get all categories, sorted by prefix
    let categories = fs.readdirSync(conf.images.imgPath)
        .sort((a, b) => +a[0] > +b[0])
        .filter(c => fs.lstatSync(conf.images.imgPath + c).isDirectory());

    let n = categories.length;
    let m = [];
    categories.forEach((c, i) => {
        let catPath = conf.images.imgPath + c + "/";
        r.categories[i] = {
            id: conf.images.imgPath + c + "/",
            name: c.substr(2, c.length),
            images: fs.readdirSync(catPath)
        };
        m.push(r.categories[i]["images"].length);
        r.categories[i]["images"].forEach((img, ix) => {
            let imgName = img.replace("_", "");
            imgName = imgName.replace(/\.[^/.]+$/, "");
            let id = r.categories[i]["id"] + img;
            let href = conf.server.host + id;
            r.categories[i]["images"][ix] = {
                name: imgName,
                id: r.categories[i]["id"] + img,
                href: href,
                thumbnail_href: href
            };
        })
    });

    r["total_combinations"] = f(n, 3, m, 0);
    res.json(r);
});

function readNextComponent(components, base, callback) {
    if (components.length === 0) {
        callback();
        return;
    }
    let el = encodeURI(conf.server.host + components.shift());
    Jimp.read(el).then(adding => {
        base.composite(adding, 0, 0);
        readNextComponent(components, base, callback);
    });
}

app.post("/render", (req, res) => {
    let components = req.body["selected[]"];

    Jimp.read(conf.images.imgBasePath).then((imgBase) => {
        readNextComponent(components, imgBase, () => {
            let name = req.body.resultname;
            let imgName = conf.images.public + conf.images.resDir + name + conf.images.extension;
            imgBase.write(imgName, () => {
                res.send({
                    result: conf.images.resDir + req.body.resultname + conf.images.extension,
                    extension: conf.images.extension
                });
            });
        });
    });
});

// useless stuff, it seems to be never triggered at all
app.post("/callback", (req, res) => {
    const data = req.body.data;
    const signature = req.body.signature;
    let sha1 = crypto.createHash("sha1");
    sha1.update(conf.liqpay.private_key + data + conf.liqpay.private_key);
    sha1 = sha1.digest("base64");
    if (sha1 === signature)
        console.log("successfully paid");
    else
        console.log("payment failed");
    res.end()
});

function sign(data) {
    let r = {};
    r["DATA"] = new Buffer(JSON.stringify(data)).toString("base64");
    let sha1 = crypto.createHash("sha1");
    sha1.update(conf.liqpay.private_key + r["DATA"] + conf.liqpay.private_key);
    r["SIGNATURE"] = sha1.digest("base64");
    return JSON.stringify(r);
}

app.post("/pay", (req, res) => {
    const {amount, resultname} = req.body;

    const data = {
        "public_key": conf.liqpay.public_key,
        "action": "pay",
        "amount": amount,
        "currency": "UAH",
        "description": "Оплата за користування послугами сервісу bugs.shpp.me",
        "order_id": "order_id_" + resultname,
        "version": "3",
        "server_url": "http://bugs.shpp.me:3013/callback",
//        "sandbox"        : "1", //
    };

    res.write(sign(data));
    res.end();
});

// is unused in a new system
app.post("/remember", (req, res) => {
    const email = req.body.email;
    const remember = req.body.remember;
    const result_url = req.body.result_url;

    let db = JSON.parse(fs.readFileSync("db.json"));
    let new_user = {
        email: email,
        remember: remember,
        result_url: result_url
    };
    db.data.push(new_user);

    fs.writeFileSync("db.json", JSON.stringify(db, null, 4));
    res.redirect(
        "http://localhost:8080/bugs.shpp.me/mail.php?email=" + email + "&regular=" + remember + "&result_url=" + result_url
    );
    res.send(":)");

});

app.listen(conf.server.port, function () {
    console.log("Server listening at port %d", conf.server.port);
});
