var express = require("express"),
    app = express(),
    bodyParser = require("body-parser"),
    mongoose = require("mongoose"),
    passport = require("passport"),
    cookieParser = require("cookie-parser"),
    localStrategy = require("passport-local"),
    methodOverride = require("method-override"),
    flash = require("connect-flash"),
    aws = require("aws-sdk"),
    User = require("./models/user");

// configure dotenv
require('dotenv').load();

//config aws region
aws.config.region="us-east-2";

//requiring routes
var commentRoutes = require("./routes/comments"),
    textbookRoutes = require("./routes/textbooks"),
    indexRoutes = require("./routes/index");

var S3_BUCKET = process.env.S3_BUCKET;
var url = process.env.DATABASEURL || "mongodb://localhost/textbook_marketplace";
mongoose.connect(url);

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname+"/public"));
app.use(methodOverride("_method"));
app.use(cookieParser('secret'));
app.use(flash());
app.locals.moment = require("moment");

//passport configuration
app.use(require("express-session")({
    secret:"this my textbook marketplace",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
   res.locals.currentUser = req.user;
   res.locals.error = req.flash("error");
   res.locals.success = req.flash("success");
   next();
});

app.use(indexRoutes);
app.use("/textbooks/:id/comments",commentRoutes);
app.use("/textbooks",textbookRoutes);

app.get("/sign-s3", function(req, res){
  var s3 = new aws.S3();
  var fileName = req.query["file-name"];
  var fileType = req.query["file-type"];
  var s3Params = {
    Bucket: S3_BUCKET,
    Key: fileName,
    Expires: 60,
    ContentType: fileType,
    ACL: "public-read"
  };

  s3.getSignedUrl("putObject", s3Params, function(err, data) {
    if(err){
      console.log(err);
      return res.end();
    }
    var returnData = {
      signedRequest: data,
      url: `https://${S3_BUCKET}.s3.amazonaws.com/${fileName}`
    };
    res.write(JSON.stringify(returnData));
    res.end();
  });
});

app.listen(process.env.PORT, process.env.IP, function(){
   console.log("server has started!"); 
});