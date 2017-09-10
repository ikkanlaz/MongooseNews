var express = require("express");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var cheerio = require("cheerio");
var request = require("request");
var handlebars = require("express-handlebars");

var Comment = require("./models/Comment.js");
var Article = require("./models/Article.js");

mongoose.Promise = Promise;

// Initialize Express
var app = express();
var PORT = process.env.PORT || 3000;

// Use body parser with our app
app.use(bodyParser.urlencoded({
    extended: false
}));

// Make public a static dir
app.use(express.static("public"));

app.engine("handlebars", handlebars({ defaultLayout: process.cwd() + '/views/layouts/main' }));
app.set('views', process.cwd() + '/views');
app.set("view engine", "handlebars");

// Database configuration with mongoose
if (process.env.PORT) {
    mongoose.connect("mongodb://heroku_xlmvqsxm:gba087mfkp73h0unr5143o95u6@ds127994.mlab.com:27994/heroku_xlmvqsxm");
} else {
    mongoose.connect("mongodb://localhost/mongoose-news");
}

var db = mongoose.connection;

// Show any mongoose errors
db.on("error", function (error) {
    console.log("Mongoose Error: ", error);
});

// Once logged in to the db through mongoose, log a success message
db.once("open", function () {
    console.log("Mongoose connection successful.");
});


// Routes
// ======

app.get("/", function (req, res) {
    // First, we grab the body of the html with request
    var resultObject = {
        articles: []
    };
    request("https://www.smashingmagazine.com/", function (error, response, html) {
        var $ = cheerio.load(html);



        // Select each element in the HTML body from which you want information.
        // NOTE: Cheerio selectors function similarly to jQuery's selectors,
        // but be sure to visit the package's npm page to see how it works
        $("article.post h2 a").each(function (i, element) {

            var result = {};

            result.link = $(element).attr("href");
            result.title = $(element).children().text();
            result.description = $(element).parent().parent().find("p").text();

            resultObject.articles.push(result);
            // Save these results in an object that we'll push into the results array we defined earlier
            var entry = new Article(result);

            // Now, save that entry to the db
            entry.save(function (err, doc) {
                // Log any errors
                if (err) {
                    console.log(err);
                }
                // Or log the doc
                else {
                    console.log(doc);
                }
            });
        });

        // Log the results once you've looped through each of the elements found with cheerio
        console.log(resultObject);
        console.log("this one?");
        console.log("here we go")
        res.render("list", resultObject);

    })
});




// Listen on port
app.listen(PORT, function () {
    console.log("App running on " + PORT + "!");
});