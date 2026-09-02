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
    <div className='h-screen min-w-0 flex bg-[#0d0f14] text-white overflow-hidden'>
      <Sidebar />
      <ChatArea />
      <Artifact />
      {!userData && (<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur'>

        <div className='w-[340px] bg-[#13151c] border border-white/[0.08] rounded-2xl p-7 flex flex-col gap-5'>
          <div className='flex flex-col gap-1'>
            <h2 className='text-[17px] font-semibold text-slate-100 tracking-tight'>Welcome to MultiMind

            </h2>
            <p className='text-[13px] text-slate-500'>Please login to continue using the app.</p>
          </div>
          <button
            className='w-full flex items-center justify-center gap-3 py-[11px] rounded-xl text-sm font-medium text-black/90 bg-white hover:bg-gray-200 transition-all duration-150 cursor-pointer'
            onClick={googleLogin}
          >
            <FcGoogle size={15} />
            Continue with Google
          </button>

        </div>
      </div>
      )}

    </div>
  )
}

export default Home