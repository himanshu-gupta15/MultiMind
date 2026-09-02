import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    fireBaseUid: {
        type: String,
        unique: true
    },
    name: String,
    email: String,
    avatar: String,
    plan: {
        type: String,
        default: "free"
    },
    credits: {
        type: Number,
        default: 100
    },
    totalCredits: Number,
    planExpiresAt: Date

},


    {
        timestamps: true
    }
)

const User = mongoose.model("User", userSchema)

export default User;