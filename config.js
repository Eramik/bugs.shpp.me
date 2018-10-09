const public = "public/"

module.exports = {
    server: {
        "host": "http://localhost:8080/bugs.shpp.me/",
        "port": "3013"
    },
    images: {
        public,
        "imgPath": public + "artwork/",
        "imgBasePath": public + "artwork/base.png",
        "extension": ".png",
        "resDir": "results/"
    },
    liqpay: {
        "public_key": "i93700517986",
        "private_key": "Q8a8PkE9ZUVizQA5bxeTAkoRYlQbLqEiUXq9nrLG"
    }

}