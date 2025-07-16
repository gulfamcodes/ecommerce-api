const mongoose = require ('mongoose');
const dotenv = require ('dotenv');

//Load env vars
dotenv.config({path:'./config.env'});

const app = require ('./app');

//MongoDB connection
mongoose.connect(process.env.DATABASE).then(()=>{
    console.log('DB connection succesful');
});
console.log('PORT:', process.env.PORT);
console.log('DATABASE:', process.env.DATABASE);

//Start server
const port = process.env.PORT || 8000;
app.listen(port, () => {
    console.log(`App running on port ${port}`);
});