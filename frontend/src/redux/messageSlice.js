import { createSlice } from "@reduxjs/toolkit"
const messageSlice = createSlice({
    name: "message",
    initialState: {

        message: [],
        artifacts: [],
        isLoading: false,
        pendingPrompt: null
    },
    reducers: {
        setMessage: (state, action) => {
            state.message = action.payload
        },
        addMessage: (state, action) => {
            state.message.push(action.payload)
        },
        setArtifacts: (state, action) => {
            state.artifacts = action.payload
        },
        setIsLoading: (state, action) => {
            state.isLoading = action.payload
        },
        // Set by the empty-state suggestion cards; Chatinput sends it and clears it
        setPendingPrompt: (state, action) => {
            state.pendingPrompt = action.payload
        }
    }

})

export const { setMessage, addMessage, setArtifacts, setIsLoading, setPendingPrompt } = messageSlice.actions
export default messageSlice.reducer