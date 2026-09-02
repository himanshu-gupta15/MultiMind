import React from 'react'
import Home from './pages/Home'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { setUserdata } from './redux/userSlice'
import getCurrentUser from './features/getCurrentUser'
function App() {
  const dispatch=useDispatch()
useEffect(() => {
  const getUser = async () => {
    const data = await getCurrentUser()
    if (data?.userData) dispatch(setUserdata(data.userData))
  }
  getUser()
}, [])
  return (
    <div>
      <Home/>
    </div>
  )
}

export default App