import crypto from "node:crypto";
import { getAuth } from 'firebase-admin/auth'
import { app } from '../config/firebase.js'
import User from '../models/user.model.js'
import redis from "../../../shared/redis/redis.js";


export const login = async (req, res) => {
  try {
    const { token } = req.body;

    const decoded = await getAuth(app).verifyIdToken(token);

    let user = await User.findOne({
      fireBaseUid: decoded.uid,
    });

    if (!user) {
      user = await User.create({
        fireBaseUid: decoded.uid,
        name: decoded.name,
        email: decoded.email,
        avatar: decoded.picture,
      });
    }

    const sessionId = crypto.randomUUID();
    await redis.set(`user-session-${user._id}`,
      sessionId
      , "EX", 60 * 60 * 24 * 7)
    await redis.set(`session-${sessionId}`, JSON.stringify({
      _id: user._id,
      userId: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      plan: user.plan,
      credits: user.credits,
      totalCredits: user.totalCredits,
      planExpiresAt: user.planExpiresAt
    }), "EX", 60 * 60 * 24 * 7) // 7 days expiration        

    const origin = req.headers.origin || req.headers.referer || "";
    const isHttps = req.secure || req.headers["x-forwarded-proto"] === "https" || origin.startsWith("https://");
    const isProduction = process.env.NODE_ENV === "production" || origin.includes("cloudfront.net") || isHttps;

    res.cookie("session", sessionId, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    const userObj = user.toObject ? user.toObject() : { ...user };
    return res.status(200).json({
      ...userObj,
      sessionId
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return res.status(500).json({
      message: error.message,
    });
  }
};

export const logout = async (req, res) => {
  try {
    const origin = req.headers.origin || req.headers.referer || "";
    const isHttps = req.secure || req.headers["x-forwarded-proto"] === "https" || origin.startsWith("https://");
    const isProduction = process.env.NODE_ENV === "production" || origin.includes("cloudfront.net") || isHttps;
    const authHeader = req.headers.authorization || req.headers.Authorization;
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
    const sessionId = req.cookies?.session || bearerToken || req.headers["x-session-id"];

    if (sessionId) {
      await redis.del(`session-${sessionId}`);
    }
    res.clearCookie("session", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
    });
    return res.status(200).json({ message: "logout successful" });

  } catch (error) {
    console.error("LOGOUT ERROR:", error);
    return res.status(500).json({
      message: error.message,
    });
  }
};


export const updateUserPayment = async (req, res) => {
  try {
    const { plan, credits, userId } = req.body
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }
    user.plan = plan;
    user.credits = (user.credits ?? 0) + credits;
    user.totalCredits = (user.totalCredits ?? 0) + credits;
    user.planExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await user.save();


    const sessionId = await redis.get(`user-session-${user._id}`)

    await redis.set(`session-${sessionId}`, JSON.stringify({
      userId: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      plan: user.plan,
      credits: user.credits,
      totalCredits: user.totalCredits,
      planExpiresAt: user.planExpiresAt

    }), "EX", 7 * 24 * 60 * 60)
    return res.status(200).json({ success: true })
  } catch (error) {
    console.error("UPDATE PAYMENT ERROR:", error);
    return res.status(500).json({ message: error.message })

  }
}



export const deductCredits = async (req, res) => {
  try {
    const { userId, agent } = req.body

    const COST = {

      chat: 1,

      search: 5,

      coding: 10,

      pdf: 10,

      ppt: 10,

      vision: 10

    };

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    const requiredCredits = COST[agent] || 1
    // Initialize credits for legacy users who were created before schema migration
    if (user.credits === null || user.credits === undefined) {
      user.credits = 100;
    }
    if (user.totalCredits === null || user.totalCredits === undefined) {
      user.totalCredits = 100;
    }
    if (user.credits < requiredCredits) {
      return res.status(400).json({ message: "Not enough credits." })
    }
    user.credits -= requiredCredits
    await user.save()

    const sessionId = await redis.get(`user-session-${user?._id}`)
    console.log("sessionId", sessionId)
    await redis.set(`session-${sessionId}`, JSON.stringify({
      userId: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      plan: user.plan,
      credits: user.credits,
      totalCredits: user.totalCredits,
      planExpiresAt: user.planExpiresAt
    }), "EX", 7 * 24 * 60 * 60)

    return res.status(200).json({ success: true, credits: user.credits })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}