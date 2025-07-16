const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema ({
    name: {
        type: String,
        required: [ true, 'User must have a name']
    },
    email : {
        type: String,
        required: [ true , ' User must have an email'],
        unique: true,
        lowercase: true,
    },
    password: {
        type:String,
        required: [ true , ' User must have a password'],
        minlength:6,
        select: false
    },
    role: {
        type:String,
        enum:['customer', 'admin'],
        default: 'customer'
    }
});

userSchema.pre('save', async function (next) {
    if(!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

userSchema.methods.correctPassword = async function (
    candidatePassword,
    userPassword
) {
    return await bcrypt.compare(
        candidatePassword,
        userPassword
    );
};

module.exports = mongoose.model('User', userSchema);