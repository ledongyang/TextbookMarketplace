var mongoose = require("mongoose");

var textbookSchema = new mongoose.Schema({
    name: String,
    image: String,
    price: String,
    location: String,
    lat: Number,
    lng: Number,
    description: String,
    createdAt: {type:Date, default:Date.now},
    author: {
        id:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    },
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment"
    }]
});

module.exports = mongoose.model("Textbook", textbookSchema);