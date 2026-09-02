import {createSlice} from '@reduxjs/toolkit'

const conversationSlice=createSlice({
    name:"conversation",
    initialState:{
        conversations:[],
        selectedConversation:null 
    },
    reducers: {
        setConversations: (state, action) => {
            state.conversations = action.payload || [];
        },
        addConversation: (state, action) => {
            if (!action.payload?._id) return;
            const filtered = state.conversations.filter(conv => conv?._id !== action.payload._id);
            state.conversations = [action.payload, ...filtered];
        },
        setSelectedConversation: (state, action) => {
            state.selectedConversation = action.payload;
        },
        setConvTitle: (state, action) => {
            const { title, conversationId } = action.payload;
            const target = state.conversations.find(conv => conv?._id === conversationId);
            const filtered = state.conversations.filter(conv => conv?._id !== conversationId);
            if (target) {
                const updated = { ...target, title };
                state.conversations = target.isPinned 
                    ? [updated, ...filtered] 
                    : [...filtered.filter(c => c.isPinned), updated, ...filtered.filter(c => !c.isPinned)];
            } else if (conversationId) {
                state.conversations = [{ _id: conversationId, title }, ...filtered];
            }
            if (state.selectedConversation?._id === conversationId) {
                state.selectedConversation = { ...state.selectedConversation, title };
            }
        },
        removeConversation: (state, action) => {
            const conversationId = action.payload;
            state.conversations = state.conversations.filter(c => c?._id !== conversationId);
            if (state.selectedConversation?._id === conversationId) {
                state.selectedConversation = null;
            }
        },
        updatePinState: (state, action) => {
            const { conversationId, isPinned } = action.payload;
            state.conversations = state.conversations.map(conv => 
                conv?._id === conversationId ? { ...conv, isPinned } : conv
            );
            // Re-sort: pinned on top, then by original order
            state.conversations.sort((a, b) => {
                if (a.isPinned === b.isPinned) return 0;
                return a.isPinned ? -1 : 1;
            });
            if (state.selectedConversation?._id === conversationId) {
                state.selectedConversation = { ...state.selectedConversation, isPinned };
            }
        }
    }
    
})

export const { setConversations, addConversation, setSelectedConversation, setConvTitle, removeConversation, updatePinState } = conversationSlice.actions;
export default conversationSlice.reducer