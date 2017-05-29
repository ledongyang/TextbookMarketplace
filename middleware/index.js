var middleware = {};
var Textbook = require("../models/textbook");
var Comment = require("../models/comment");

//all middleware goes here
middleware.isLoggedin = function(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error","Please Login First!");
    res.redirect("/login");
}

middleware.checkTextbookOwnership = function(req, res, next){
    if(req.isAuthenticated()){
        Textbook.findById(req.params.id, function(err, textbook){
           if(err){
               req.flash("error",err.message);
               res.redirect("back");
           } else{
               if(textbook.author.id.equals(req.user._id)){
                   next();
               }else{
                   req.flash("error","You don't have permission to do that!");
                   res.redirect("/textbooks/"+req.params.id);
               }
           }
        });
    }else{
        req.flash("error","Please Login First!");
        res.redirect("/login");
    }
}

middleware.checkCommentOwnership = function(req, res, next){
    if(req.isAuthenticated()){
        Comment.findById(req.params.comment_id, function(err, comment){
           if(err){
               req.flash("error",err.message);
               res.redirect("back");
           } else{
               if(comment.author.id.equals(req.user._id)){
                   next();
               }else{
                   req.flash("error","You don't have permission to do that!");
                   res.redirect("/textbooks/"+req.params.id+"/comments/"+req.params.comment_id);
               }
           }
        });
    }else{
        req.flash("error","Please Login First!");
        res.redirect("/login");
    }
}

module.exports = middleware;