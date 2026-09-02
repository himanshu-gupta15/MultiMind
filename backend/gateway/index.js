import express from "express";
import dotenv from "dotenv";
import proxy from "express-http-proxy";
import cors from 'cors';
import morgan from "morgan";
import cookieParser from "cookie-parser";
import protect from "./middleware/auth.middleware.js";
import { getCurrentUser } from "./controllers/user.controller.js";
import { proxyWithHeader } from "./utils/proxyWithHeader.js";

dotenv.config();

const port = process.env.PORT || 8000;
const app = express();

app.set("trust proxy", 1);

app.use(morgan("dev"));
const allowedOrigins = [
    process.env.FRONTEND_URL,
    "https://d2pplrl0246irj.cloudfront.net",
    "http://localhost:5173"
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".cloudfront.net")) {
            callback(null, true);
        } else {
            callback(null, true);
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-session-id", "x-user-id"]
}));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());

app.use("/api/auth", proxy(process.env.AUTH_SERVICE_URL || process.env.AUTH_SERVICE, { limit: "50mb" }));
app.use("/api/chat", protect, proxyWithHeader(process.env.CHAT_SERVICE_URL || process.env.CHAT_SERVICE));
app.use("/api/agent", protect, proxyWithHeader(process.env.AGENT_SERVICE_URL || process.env.AGENT_SERVICE));
app.use("/api/billing", protect, proxyWithHeader(process.env.BILLING_SERVICE_URL || process.env.BILLING_SERVICE));

app.get("/api/me", protect, getCurrentUser);

app.get("/", (req, res) => {
    res.json({ message: "hello from gateway V2" });
});

app.listen(port, () => {
    console.log(`gateway started at ${port}`);
});