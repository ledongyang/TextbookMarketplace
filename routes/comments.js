var express = require("express");
var router = express.Router({mergeParams: true});
var Textbook = require("../models/textbook");
var Comment = require("../models/comment");
var middleware = require("../middleware");

//new comment
router.get("/new", middleware.isLoggedin, function(req, res){
    Textbook.findById(req.params.id, function(err, foundTextbook){
       if(err){
           req.flash("error",err.message);
           res.redirect("back");
       } else{
           res.render("comments/new",{textbook:foundTextbook});
       }
    });
});

//create comment
router.post("/", middleware.isLoggedin, function(req, res){
    Textbook.findById(req.params.id, function(err, foundTextbook){
        if(err){
            req.flash("error",err.message);
            res.redirect("back");
        }else{
            Comment.create(req.body.comment, function(err, comment){
                if(err){
                    req.flash("error",err.message);
                    res.redirect("back");
                }else{
                    comment.author.username=req.user.username;
                    comment.author.id=req.user._id;
                    comment.save();
                    foundTextbook.comments.push(comment);
                    foundTextbook.save();
                    req.flash("success","New comment added!");
                    res.redirect("/textbooks/"+foundTextbook._id);
                }
            })
        }
    })
});

//edit comment
router.get("/:comment_id/edit", middleware.checkCommentOwnership, function(req, res){
    Comment.findById(req.params.comment_id, function(err, comment){
       if(err){
           req.flash("error",err.message);
           res.redirect("back");
       } else{
           res.render("comments/edit",{textbook_id: req.params.id, comment: comment});
       }
    });
});

//update comment
router.put("/:comment_id", middleware.checkCommentOwnership, function(req, res){
   Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, comment){
     if(err){
         req.flash("error",err.message);
         res.redirect("back");
     } else{
         req.flash("success","Successfully edited a comment!");
         res.redirect("/textbooks/"+req.params.id);
     }
   });
});

//delete comment
router.delete("/:comment_id", middleware.checkCommentOwnership, function(req, res){
   Comment.findByIdAndRemove(req.params.comment_id, function(err,comment){
      if(err){
          req.flash("error",err.message);
          res.redirect("back");
      } else{
          Textbook.findByIdAndUpdate(req.params.id, {
              $pull:{
                  comments: comment._id
              }
          }, function(err){
              if(err){
                  req.flash("error",err.message);
              }else{
                  req.flash("success","Successfully deleted a comment!");
                  res.redirect("/textbooks/"+req.params.id);
              }
          })
          
      }
   });
});

module.exports = router;