var express = require("express");
var router = express.Router();
var Textbook = require("../models/textbook");
var middleware = require("../middleware");
var geocoder = require("geocoder");

// Define escapeRegex function for search feature
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

//index route
router.get("/", function(req, res){
    if(req.query.search && req.xhr){
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
      // Get all campgrounds from DB
      Textbook.find({name: regex}, function(err, allTextbooks){
         if(err){
            console.log(err);
         } else {
            res.status(200).json(allTextbooks);
         }
      });
    }else{
        Textbook.find({}).sort({"createdAt":1}).exec(function(err,allTextbooks){
            if(err){
                req.flash("error",err.message);
                res.redirect("back");
            }else{
                if(req.xhr){
                    res.json(allTextbooks);
                }else{
                    res.render("textbooks/index", {textbooks:allTextbooks, page:"textbooks"});
                }
            }
        }); 
    }
});

//create route
router.post("/", middleware.isLoggedin,function(req, res){
    var newTextbook = req.body.textbook;
    newTextbook.author={
        id: req.user._id,
        username: req.user.username
    }
    geocoder.geocode(newTextbook.location, function(err, data){
        if(err || data.results[0]==null){
            req.flash("error","Invalid address! Please enter again!");
            res.redirect("back");
        }else{
            var lat = data.results[0].geometry.location.lat;
            var lng = data.results[0].geometry.location.lng;
            var location = data.results[0].formatted_address;
            newTextbook.location=location;
            newTextbook.lat=lat;
            newTextbook.lng=lng;
            Textbook.create(newTextbook,function(err, textbook){
                if(err){
                    req.flash("error",err.message);
                    res.redirect("back");
                }else{
                    req.flash("success","New textbook added!");
                    res.redirect("/textbooks");
                }
            });
        }
    });
});

//new route
router.get("/new", middleware.isLoggedin, function(req, res){
   res.render("textbooks/new"); 
});

//show route
router.get("/:id", function(req, res){
    Textbook.findById(req.params.id).populate("comments").exec(function(err, foundTextbook){
        if(err){
            req.flash("error",err.message);
            res.redirect("/textbooks");
        }else{
            res.render("textbooks/show",{textbook:foundTextbook});
        }
    })
});

//edit route
router.get("/:id/edit", middleware.checkTextbookOwnership, function(req, res){
    Textbook.findById(req.params.id, function(err, textbook){
       if(err){
           req.flash("error",err.message);
           res.redirect("back");
       } else{
           res.render("textbooks/edit",{textbook:textbook}); 
       }
    });
});

//update route
router.put("/:id", middleware.checkTextbookOwnership, function(req, res){
    geocoder.geocode(req.body.textbook.location, function(err, data){
        if(err || data.results[0]==null){
            req.flash("error","Invalid address! Please enter again!");
            res.redirect("back");
        }else{
            var lat = data.results[0].geometry.location.lat;
            var lng = data.results[0].geometry.location.lng;
            var location = data.results[0].formatted_address;
            var updatedTextbook = req.body.textbook;
            updatedTextbook.lat=lat;
            updatedTextbook.lng=lng;
            updatedTextbook.location=location;
            Textbook.findByIdAndUpdate(req.params.id, updatedTextbook, function(err, textbook){
                if(err){
                    req.flash("error",err.message);
                    res.redirect("back");
                } else{
                    req.flash("success","Successfully edited a textbook!");
                    res.redirect("/textbooks/" + req.params.id);
                }
            });
        }
    });
});

//delete route
router.delete("/:id", middleware.checkTextbookOwnership, function(req, res){
   Textbook.findByIdAndRemove(req.params.id, function(err){
     if(err){
         req.flash("error",err.message);
         res.redirect("/textbooks");
     }  else{
         req.flash("success","Successfully deleted a textbook!");
         res.redirect("/textbooks");
     }
   });
});

module.exports=router;