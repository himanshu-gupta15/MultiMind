import express from "express"
import { createConversation, getConversations, getMessages, saveMessage, updateConversation, togglePinConversation, deleteConversation, getConversationById } from "../controllers/chat.controllers.js"

const router = express.Router()

router.post("/conversations", createConversation)
router.get("/get-conversations", getConversations)
router.get("/get-conversation/:id", getConversationById)
router.post("/save-message", saveMessage)
router.get("/get-messages/:conversationId", getMessages)
router.post("/update-conversation", updateConversation)
router.post("/toggle-pin/:id", togglePinConversation)
router.post("/toggle-pin", togglePinConversation)
router.delete("/delete/:id", deleteConversation)
router.post("/delete-conversation", deleteConversation)

export default router
