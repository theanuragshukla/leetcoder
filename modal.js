var mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
    uid: String,
    created: {
        type: Date,
        default: Date.now,
    },
    modified: {
        type: Date,
        default: Date.now,
    },
    verified: {
        type: Boolean,
        default: false,
    },
    email: String,
});
module.exports = {
    userSchema: new mongoose.model('user', userSchema, 'leetcoder'),
};
