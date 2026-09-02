import { Code2, FileText, MessageSquare, Presentation, Send, X, Zap, Image, Globe, Paperclip, Mic, MicOff } from 'lucide-react';
import React, { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import sendMessage from '../features/sendMessage';
import { addMessage, setArtifacts, setIsLoading } from '../redux/messageSlice';
import { addConversation, setSelectedConversation, setConvTitle } from '../redux/conversationSlice';
import { createConversation } from '../features/createConversation';
import { updateConversation } from '../features/updateConversation';
import { useEffect } from 'react';

function Chatinput() {
  const [value, setValue] = useState("")
  const [selectedAgent, setSelectedAgent] = useState("Auto")
  const [selectedFile, setSelectedFile] = useState(null)
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef(null)
  const fileRef = useRef(null)

  const dispatch = useDispatch()
  const { isLoading } = useSelector(state => state.message)
  const { selectedConversation } = useSelector(state => state.conversation)

  const canSend = (value.trim().length > 0 || Boolean(selectedFile)) && !isLoading;

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition()
    recognition.lang = "en-US"
    recognition.interimResults = true,
      recognition.continous = true;

    recognition.onresult = (event) => {

      let transcript = ""
      for (let index = event.resultIndex; index < event.results.length; index++) {

        transcript += event.results[index][0].transcript
      }
      setValue(transcript)


    }
    recognition.onend = () => {
      setListening(false)
    }
    recognitionRef.current = recognition;
  }, [])

  const toggleMic = () => {
    if (!recognitionRef.current) {
      alert("speech recognition not supported")
    }
    if (listening) {
      recognitionRef.current.stop()
      setListening(false)
    } else {
      recognitionRef.current.start()
      setListening(true)
    }
  }



  const handleSendMessage = async () => {
    const trimmed = value.trim();
    if ((!trimmed && !selectedFile) || isLoading) return;

    const promptText = trimmed || (selectedFile ? `Analyze uploaded file: ${selectedFile.name}` : "");
    const fileToSend = selectedFile;

    // 1. Immediately clear input & file
    setValue("");
    setSelectedFile(null);
    if (fileRef.current) fileRef.current.value = "";

    // 2. Immediately show user message & loading indicator on screen
    dispatch(addMessage({ role: "user", content: promptText }));
    dispatch(setIsLoading(true));

    try {
      const initialTitle = (trimmed || fileToSend?.name || "Conversation").slice(0, 40);

      // 3. Ensure conversation exists
      let conversation = selectedConversation;
      if (!conversation || !conversation._id) {
        const conv = await createConversation(initialTitle);
        if (conv) {
          conversation = conv;
          dispatch(addConversation(conv));
          dispatch(setSelectedConversation(conv));
          localStorage.setItem("active_chat_id", conv._id);
          const newUrl = `${window.location.pathname}?c=${conv._id}`;
          window.history.replaceState({ id: conv._id }, "", newUrl);
        }
      } else {
        const currentTitle = conversation?.title;
        if (!currentTitle || currentTitle === "New Conversation" || currentTitle === "New Chat") {
          try {
            const updatedConversation = await updateConversation({ id: conversation._id, title: initialTitle });
            dispatch(setConvTitle({ conversationId: conversation._id, title: updatedConversation?.title || initialTitle }));
            if (updatedConversation?._id) {
              dispatch(setSelectedConversation(updatedConversation));
            }
          } catch (error) {
            console.error("Failed to update conversation title:", error);
            dispatch(setConvTitle({ conversationId: conversation._id, title: initialTitle }));
          }
        }
      }

      const conversationId = conversation?._id || "";

      if (!conversationId) {
        dispatch(setIsLoading(false));
        dispatch(addMessage({
          role: "assistant",
          content: "Failed to initialize conversation. Please try again."
        }));
        return;
      }

      // 5. Build FormData and send message
      const formData = new FormData();

      formData.append("prompt", promptText);
      formData.append("conversationId", conversationId);
      formData.append("agent", selectedAgent.toLowerCase());
      if (fileToSend) {
        formData.append("file", fileToSend);
      }

      const data = await sendMessage(formData);
      dispatch(setIsLoading(false));

      if (data && (data.answer || data.artifacts || data.images)) {
        dispatch(setArtifacts(data.artifacts || []));
        dispatch(addMessage({
          role: "assistant",
          content: data.answer || "Done.",
          images: data.images,
          artifacts: data.artifacts
        }));
      } else {
        dispatch(addMessage({
          role: "assistant",
          content: "Sorry, an error occurred while processing your request. Please try again."
        }));
      }
    } catch (err) {
      console.error("handleSendMessage error:", err);
      dispatch(setIsLoading(false));
      dispatch(addMessage({
        role: "assistant",
        content: "Network error occurred. Please try again."
      }));
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend) {
        handleSendMessage();
      }
    }
  };

  const agents = [
    {
      id: "auto",
      icon: Zap,
      label: "Auto"
    },
    {
      id: "chat",
      icon: MessageSquare,
      label: "Chat"
    },
    {
      id: "coding",
      icon: Code2,
      label: "Coding"
    },
    {
      id: "pdf",
      icon: FileText,
      label: "PDF"
    },
    {
      id: "ppt",
      icon: Presentation,
      label: "PPT"
    },
    {
      id: "vision",
      icon: Image,
      label: "Vision"
    },
    {
      id: "search",
      icon: Globe,
      label: "Search"
    }
  ]

  return (
    <div className='w-full overflow-hidden px-4 md:px-6 py-4 border-t border-white/[0.06] bg-[#0d0f14] shrink-0'>
      <div className='w-full max-w-4xl mx-auto flex flex-col gap-3.5'>
        {/* Agent/Mode Switcher */}
        <div className='flex items-center gap-2 overflow-x-auto pb-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden w-full'>
          {agents.map((agent) => {
            const isActive = selectedAgent === agent.label;
            const Icon = agent.icon;
            return (
              <button
                key={agent.id}
                onClick={() => setSelectedAgent(agent.label)}
                className={`
                  flex-shrink-0 cursor-pointer inline-flex items-center gap-1.5 
                  px-3.5 py-2 rounded-full text-xs font-semibold border transition-all duration-200
                  ${isActive
                    ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white border-transparent shadow-[0_2px_10px_rgba(99,102,241,0.3)] scale-[1.02]"
                    : "bg-white/[0.03] text-slate-400 border-white/[0.06] hover:bg-white/[0.07] hover:text-slate-200"
                  }
                `}
              >
                <Icon
                  size={13.5}
                  className={isActive ? "text-white" : "text-slate-500"}
                />
                {agent.label}
              </button>
            );
          })}
        </div>

        {/* Input Card Container */}
        <div className='flex flex-col gap-2.5 bg-white/[0.03] border border-white/[0.07] focus-within:border-indigo-500/40 focus-within:bg-white/[0.045] focus-within:shadow-[0_0_24px_rgba(99,102,241,0.08)] rounded-2xl p-4 transition-all duration-200'>

          {/* Text Area */}
          <textarea
            placeholder='Ask Anything... (Press Enter to send, Shift+Enter for new line)'
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            value={value}
            disabled={isLoading}
            className='w-full bg-transparent outline-none resize-none text-[14px] text-slate-200 placeholder:text-slate-600 leading-relaxed [scrollbar-width:none] [&::-webkit-scrollbar]:hidden disabled:opacity-50 min-h-[56px]'
            rows={3}
          />

          {/* Selected File Attachment Preview */}
          {selectedFile && (
            <div className='mt-1 mb-2'>
              <div className='inline-flex items-center gap-3 rounded-xl bg-white/[0.03] border border-white/[0.06] px-3.5 py-2 shadow-sm'>
                {selectedFile?.type === "application/pdf" ? (
                  <FileText size={18} className='text-red-400 shrink-0' />
                ) : (
                  selectedFile.type.startsWith("image/") && (
                    <img
                      src={URL.createObjectURL(selectedFile)}
                      className='h-9 w-9 rounded-lg object-cover shrink-0'
                      alt="preview"
                    />
                  )
                )}
                <div className='min-w-0 max-w-[180px]'>
                  <p className='text-xs font-medium text-slate-200 truncate'>
                    {selectedFile?.name}
                  </p>
                  <p className='text-[10px] text-slate-500 mt-0.5'>
                    {Math.ceil(selectedFile.size / 1024)} KB
                  </p>
                </div>
                <button
                  type='button'
                  className='ml-1.5 p-1 rounded-md hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors cursor-pointer border-none bg-transparent'
                  onClick={() => { setSelectedFile(null); if (fileRef.current) fileRef.current.value = ""; }}
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className='flex items-center justify-between pt-2.5 border-t border-white/[0.04]'>
            <div className='flex items-center gap-1'>
              <input
                type='file'
                accept='.pdf,image/*'
                hidden
                ref={fileRef}
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setSelectedFile(file);
                  }
                }}
              />

              <button
                type='button'
                className='flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/[0.05] transition-all duration-150 bg-transparent border-none cursor-pointer'
                onClick={() => fileRef.current.click()}
              >
                <Paperclip size={16} />
              </button>


              <button
                onClick={toggleMic}
                className={`flex items-center justify-center w-8 h-8 rounded-lg  transition-all duration-150  cursor-pointer ${listening
                  ? "bg-red-500 text-white"
                  : "text-slate-600 hover:bg-white/[0.05]"
                  }`}
              >
                {listening ? <Mic size={16} /> : <MicOff size={16} />}
              </button>
            </div>

            <button

              type='button'
              onClick={handleSendMessage}
              disabled={!canSend}
              className={`flex items-center justify-center w-8 h-8 rounded-lg border-none transition-all duration-200 ${canSend
                ? "bg-gradient-to-br from-indigo-500 to-violet-700 hover:opacity-90 shadow-md shadow-indigo-500/10 hover:shadow-indigo-500/20 text-white hover:scale-[1.04] cursor-pointer"
                : "bg-white/[0.04] text-slate-600 cursor-not-allowed opacity-40"
                }`}
            >
              <Send size={14} />
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}

export default Chatinput