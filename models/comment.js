var mongoose = require("mongoose");

var commentSchema = new mongoose.Schema({
    text:String,
    createdAt:{
        type: Date,
        default: Date.now
    },
    author:{
        id:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    },
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment"
    },
    ancestorIds:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment"
    }],
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Textbook"
    }
});

module.exports=mongoose.model("Comment", commentSchema);