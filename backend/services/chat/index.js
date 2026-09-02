import express from "express" 
import dotenv from "dotenv" 
import connectDb from "./config/db.js" 
import router from "./routes/chat.routes.js"

dotenv.config()

const app=express() 
const port=process.env.PORT 
app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ limit: "50mb", extended: true }))

app.use("/",router)
app.get("/",(req,res)=>{
    res.json({message:"Hello from chat service"})
})

app.use((err, req, res, next) => {
    if (err?.type === "request.aborted" || err?.message === "request aborted" || req?.aborted) {
        return res.status(499).json({ message: "request aborted" });
    }

    if (err?.type === "entity.too.large") {
        return res.status(413).json({ message: "request body too large" });
    }

    console.error(err);
    return res.status(500).json({ message: "internal server error" });
});

app.listen(port,async()=>{
    console.log(`Chat service is running on port ${port}`);
    await connectDb()
})