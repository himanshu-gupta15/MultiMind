import express from "express";
import dotenv from "dotenv";
import connectDb from "./config/db.js";
dotenv.config();
import router from "./routes/auth.route.js";

const port=process.env.PORT 
const app=express();
app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ limit: "50mb", extended: true }))

app.use("/",router)
app.get("/",(req,res)=>{
    res.json({message:"Hello from auth service"})
})
app.listen(port,()=>{
    console.log(`Auth service is running on port ${port}`);
    connectDb()
}) 