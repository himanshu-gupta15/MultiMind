import React from 'react'
import { signInWithPopup } from 'firebase/auth'
import { auth, googleProvider } from '../../utils/firebase.js'
import api from '../../utils/axios.js'
import { FcGoogle } from "react-icons/fc"
import { useDispatch } from 'react-redux'
import { setUserdata } from '../redux/userSlice.js'
import { useSelector } from 'react-redux'
import Sidebar from '../components/Sidebar.jsx'
import ChatArea from '../components/ChatArea.jsx'
import Artifact from '../components/Artifact.jsx'
import BillingDraw from '../components/BillingDraw.jsx'

function Home() {
  const dispatch = useDispatch()
  const { userData } = useSelector(state => state.user)

  console.log(userData)
  const handleLogin = async (token) => {
    try {
      const { data } = await api.post("/api/auth/login", { token })
      console.log(data)
      if (data?.sessionId) {
        localStorage.setItem("session_id", data.sessionId)
      }
      dispatch(setUserdata(data))
    } catch (error) {
      console.log(error)
    }
  }
  const googleLogin = async () => {
    const data = await signInWithPopup(auth, googleProvider)
    const token = await data.user.getIdToken()
    console.log(token)
    await handleLogin(token)
    console.log(data)
  }
  return (
    <div className='h-dvh min-w-0 flex bg-canvas text-ink font-sans overflow-hidden relative'>
      <Sidebar />
      <ChatArea />
      <Artifact />
      <BillingDraw />
      {!userData && (
        <div className='fixed inset-0 z-80 grid place-items-center p-4 bg-scrim/50 backdrop-blur-sm'>
          <div className='w-full max-w-100 flex flex-col gap-4 px-6 pt-9 pb-6 rounded-[32px] bg-canvas shadow-soft-lg'>
            <div className='w-12 h-12 rounded-full bg-clay text-canvas grid place-items-center font-display text-2xl'>M</div>
            <div className='flex flex-col gap-1.5'>
              <h2 className='font-display text-[26px] leading-tight'>Welcome to MultiMind</h2>
              <p className='text-sm text-ink/85 leading-relaxed'>Sign in to keep your chats, files and credits in sync across devices.</p>
            </div>
            <button
              className='w-full h-12 flex items-center justify-center gap-2.5 rounded-full bg-clay hover:bg-clay-600 active:bg-clay-700 text-canvas text-[15px] font-semibold cursor-pointer transition-colors'
              onClick={googleLogin}
            >
              <FcGoogle size={17} className='bg-white rounded-full p-px' />
              Continue with Google
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Home
