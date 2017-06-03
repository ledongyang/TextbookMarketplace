var express = require("express");
var router = express.Router();
var Comment = require("../models/comment");
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
        }else if(foundTextbook.comments.length==0){
            res.render("textbooks/show",{textbook:foundTextbook, rootComments:[]});
        }else{
            Comment.find({postId:foundTextbook._id, parentId:null}, function(err, rootComments){
                
                if(err){
                    console.log(err);
                }else{
                    var rootCommentsArr=[];
                    rootComments.forEach(function(rootComment){
                        Comment.find({ancestorIds:rootComment._id}, function(err, thread){
                           if(err){
                               console.log(err);
                           } else{
                                var sort = function (a, b) {
                                  if (a.ancestorIds.length < b.ancestorIds.length) {
                                    return 1;
                                  }
                                  if (a.ancestorIds.length > b.ancestorIds.length) {
                                    return -1;
                                  }
                                  
                                  if(a.createdAt > b.createdAt){
                                      return 1;
                                  }
                                  
                                  if(a.createdAt < b.createdAt){
                                      return -1;
                                  }
                                  // a must be equal to b
                                  return 0;
                                };
                                thread.sort(sort);
                                
                                thread.forEach(function(comment){
                                   if(comment.ancestorIds.length>1){
                                       var parentComment = thread.find(function(obj){
                                           return obj._id.equals(comment.parentId);
                                       });
                                       
                                       if(parentComment){
                                            if (!parentComment.replies) {
                                                parentComment.replies = [];
                                            }
                                            parentComment.replies.push(comment);
                                       }else{
                                           console.log("Broken reply chain.");
                                       }
                                   } 
                                });
                                rootCommentsArr.push(thread[thread.length-1]);
                                
                                if(rootComments.length==rootCommentsArr.length){
                                    rootCommentsArr.sort({"createdAt":1});
                                    res.render("textbooks/show",{textbook:foundTextbook, rootComments:rootCommentsArr});
                                }
                                
                           }
                        });
                    });
                    
                }
            });
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
   Textbook.findByIdAndRemove(req.params.id, function(err, textbook){
     if(err){
         req.flash("error",err.message);
         res.redirect("/textbooks");
     }  else{
         //delete all post comments
         Comment.find({postId:textbook._id}).remove(function(err){
             if(err){
                 console.log(err);
             }else{
                 req.flash("success","Successfully deleted a textbook!");
                 res.redirect("/textbooks");
             }
         });
     }
   });
});

module.exports=router;