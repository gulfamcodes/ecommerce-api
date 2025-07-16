const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required:[true, 'Product must have a name']
    },
    description: String,
    price: {
        type:Number,
        required : [ true, 'Product must have a price']
    },
    category: {
        type: String,
        required:[true, 'Product must have a category']
    },
    image: {
        type:String,
        default: 'default.jpg'
    },
    countInStock: {
        type: Number,
        default: 0
    },
    ratingsAverage: {
        type: Number,
        default:4.5
    },
    ratingsQuantity : {
        type: Number,
        default:0
    },   
},
{timeStamps:true}
);

module.exports = mongoose.model('Product', productSchema);