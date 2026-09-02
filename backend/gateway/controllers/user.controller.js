export const getCurrentUser = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Not authenticated" });
        }
        const userObj = {
            ...req.user,
            _id: req.user._id || req.user.userId,
            userId: req.user.userId || req.user._id
        };
        return res.status(200).json({ userData: userObj });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
