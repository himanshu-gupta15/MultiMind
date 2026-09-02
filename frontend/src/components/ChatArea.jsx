import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setArtifacts, setMessage } from '../redux/messageSlice'
import { useEffect } from 'react'
import Nav from './Nav'
import MessageList from './MessageList'
import Chatinput from './Chatinput'
import getMessages from '../features/getMessages'

function ChatArea() {
  const { selectedConversation } = useSelector(state => state.conversation)
  const currentConvIdRef = React.useRef(null)
  const dispatch = useDispatch()

  useEffect(() => {
    const getMesg = async () => {
      if (selectedConversation?._id) {
        if (currentConvIdRef.current !== selectedConversation._id) {
          currentConvIdRef.current = selectedConversation._id
          const data = await getMessages(selectedConversation._id)
          if (data && data.length > 0) {
            dispatch(setMessage(data))
            const latestArtifactMessage = [...data].reverse().find(msg => msg.artifacts && msg.artifacts.length > 0)
            dispatch(setArtifacts(latestArtifactMessage?.artifacts || []))
          }
        }
      } else {
        currentConvIdRef.current = null
        dispatch(setMessage([]))
        dispatch(setArtifacts([]))
      }
    }
    getMesg()
  }, [selectedConversation?._id])
  return (
    <div className='flex-1 min-w-0 flex flex-col'>
      <Nav />
      <MessageList />
      <Chatinput />
    </div>
  )
}

export default ChatArea