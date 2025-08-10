import mongoose from "mongoose";

const connectDB = async () => {
    try{
        mongoose.connection.on("connected", ()=>{
            console.log('connection established');  
        })
        await mongoose.connect(`${process.env.MONGO_URI}`);
    } catch(e){
        console.error(e);
    }
}

export default connectDB;
