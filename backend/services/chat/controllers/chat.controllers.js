import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import redis from "../../../shared/redis/redis.js";

export const createConversation=async(req,res)=>{
    try{
        const userId=req.headers["x-user-id"]
        const { title } = req.body || {};
        const conversation=await Conversation.create({
            userId: userId,
            title: title ? title.trim().slice(0, 50) : "New Conversation"
        })

        return res.status(200).json(conversation)

    }catch(error){
        return res.status(500).json({message:`create conversation error ${error}`})
    }
}

export const getConversations=async(req,res)=>{
    try{
        const userId=req.headers["x-user-id"]
        const conversations=await Conversation.find({userId:userId}).sort({ isPinned: -1, updatedAt: -1 })
        return res.status(200).json(conversations)
    }catch(error){
        return res.status(500).json({message:`get conversations error ${error}`})
    }
}


export const saveMessage=async(req,res)=>{
    try{
        const {conversationId,role,content,images,artifacts}=req.body 
        const message=await Message.create({
            conversationId,
            content,
            role,
            images,
            artifacts
        })
        // Also touch conversation updatedAt
        await Conversation.findByIdAndUpdate(conversationId, { updatedAt: new Date() });
        return res.status(200).json(message)
    }catch(error){
        return res.status(500).json({message:`save message error ${error}`})
    }
}

export const getMessages=async(req,res)=>{
    try{
        
        const messages=await Message.find({
            conversationId: req.params.conversationId
        }).sort({ createdAt: 1 })
        return res.status(200).json(messages)
    }catch(error){
        return res.status(500).json({message:`get messages error ${error}`})
    }
}

export const updateConversation=async(req,res)=>{
    try{
        const userId=req.headers["x-user-id"]
        const {id,title}=req.body 
        if(!id){
            return res.status(400).json({message:"Conversation ID is required"})
        }
        const conversation=await Conversation.findOneAndUpdate(
            { _id: id, userId },
            {
                title,
                updatedAt: new Date()
            },
            { new: true }
        )
        if(!conversation){
            return res.status(404).json({message:"Conversation not found"})
        }
        return res.status(200).json(conversation)

    }catch(error){
        return res.status(500).json({message:`update conversation error ${error}`})
    }
}

export const togglePinConversation = async (req, res) => {
    try {
        const userId = req.headers["x-user-id"];
        const id = req.params.id || req.body.id;
        if (!id) {
            return res.status(400).json({ message: "Conversation ID is required" });
        }
        const conv = await Conversation.findOne({ _id: id, userId });
        if (!conv) {
            return res.status(404).json({ message: "Conversation not found" });
        }
        conv.isPinned = !conv.isPinned;
        await conv.save();
        return res.status(200).json(conv);
    } catch (error) {
        return res.status(500).json({ message: `toggle pin error ${error}` });
    }
};

export const getConversationById = async (req, res) => {
    try {
        const userId = req.headers["x-user-id"];
        const id = req.params.id || req.params.conversationId;
        const conv = await Conversation.findOne({ _id: id, userId });
        if (!conv) {
            return res.status(404).json({ message: "Conversation not found" });
        }
        return res.status(200).json(conv);
    } catch (error) {
        return res.status(500).json({ message: `get conversation error ${error}` });
    }
};

export const deleteConversation = async (req, res) => {
    try {
        const userId = req.headers["x-user-id"];
        const id = req.params.id || req.body.id;
        if (!id) {
            return res.status(400).json({ message: "Conversation ID is required" });
        }
        const deletedConversation = await Conversation.findOneAndDelete({ _id: id, userId });
        if (!deletedConversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }
        await Message.deleteMany({ conversationId: id });
        try {
            await redis.del(`messages-${id}`);
        } catch (rErr) {
            console.warn("Redis delete error:", rErr?.message);
        }
        return res.status(200).json({ success: true, message: "Conversation permanently deleted" });
    } catch (error) {
        return res.status(500).json({ message: `delete conversation error ${error}` });
    }
};