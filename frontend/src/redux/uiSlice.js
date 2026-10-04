import { createSlice } from '@reduxjs/toolkit'
import { setArtifacts } from './messageSlice'

const uiSlice = createSlice({
    name: "ui",
    initialState: {
        sidebarOpen: false,
        billingOpen: false,
        artifactOpen: true,
        mobileArtifactOpen: false
    },
    reducers: {
        setSidebarOpen: (state, action) => {
            state.sidebarOpen = action.payload
        },
        setBillingOpen: (state, action) => {
            state.billingOpen = action.payload
        },
        setArtifactOpen: (state, action) => {
            state.artifactOpen = action.payload
        },
        setMobileArtifactOpen: (state, action) => {
            state.mobileArtifactOpen = action.payload
        }
    },
    extraReducers: (builder) => {
        // Re-open the desktop preview whenever a response brings new artifacts
        builder.addCase(setArtifacts, (state, action) => {
            if (action.payload?.length) state.artifactOpen = true
        })
    }
})

export const { setSidebarOpen, setBillingOpen, setArtifactOpen, setMobileArtifactOpen } = uiSlice.actions
export default uiSlice.reducer
