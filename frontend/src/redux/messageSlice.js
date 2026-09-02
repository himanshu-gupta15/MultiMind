import { createSlice } from "@reduxjs/toolkit"
const messageSlice = createSlice({
    name: "message",
    initialState: {

        message: [],
        artifacts: [],
        isLoading: false
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
        }
    }

})

export const { setMessage, addMessage, setArtifacts, setIsLoading } = messageSlice.actions
export default messageSlice.reducer