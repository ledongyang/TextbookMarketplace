var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/user");

//root route
router.get("/", function(req, res){
    res.render("landing");
});

//==========
//Auth Routes
//==========
//show register form
router.get("/register", function(req, res){
   res.render("register",{page:"register"}); 
});

//handle register logic
router.post("/register", function(req, res){
    var newUser=new User({username:req.body.username});
    User.register(newUser, req.body.password, function(err, user){
       if(err){
           req.flash("error",err.message);
           return res.redirect("/register");
       } 
       passport.authenticate("local")(req, res, function(){
           req.flash("success","Welcome to YelpCamp "+user.username);
           res.redirect("/textbooks");
       })
    });
});

//show login form
router.get("/login", function(req, res){
   res.render("login",{page:"login"}); 
});

//hadle login logic
router.post("/login", passport.authenticate("local", {
    successRedirect:"/textbooks",
    failureRedirect:"/login",
    failureFlash: "Username or password is incorrect!",
    successFlash: "Welcome back!"
}), function(req, res){
    
})

//logout route
router.get("/logout", function(req, res){
   req.logout();
   req.flash("success","Successfully logged out!");
   res.redirect("/textbooks");
});


module.exports = router;