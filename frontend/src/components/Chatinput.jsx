import { Code2, FileText, MessageSquare, Presentation, ArrowUp, X, Zap, Image, Globe, Paperclip, Mic } from 'lucide-react';
import React, { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import sendMessage from '../features/sendMessage';
import { addMessage, setArtifacts, setIsLoading, setPendingPrompt } from '../redux/messageSlice';
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
  const { isLoading, pendingPrompt } = useSelector(state => state.message)
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
      return
    }
    if (listening) {
      recognitionRef.current.stop()
      setListening(false)
    } else {
      recognitionRef.current.start()
      setListening(true)
    }
  }



  const handleSendMessage = async (overrideText, overrideAgent) => {
    const trimmed = (overrideText ?? value).trim();
    const agentToUse = overrideAgent || selectedAgent;
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
      formData.append("agent", agentToUse.toLowerCase());
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

  // Suggestion cards on the empty state hand us a prompt to send
  useEffect(() => {
    if (!pendingPrompt) return;
    dispatch(setPendingPrompt(null));
    handleSendMessage(pendingPrompt.text, pendingPrompt.agent);
  }, [pendingPrompt]);

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

  const iconBtn = 'w-9 h-9 rounded-full grid place-items-center cursor-pointer transition-colors';

  return (
    <div className='shrink-0 px-4 md:px-6.5 pb-4'>
      <div className='max-w-195 mx-auto flex flex-col gap-2'>
        {/* Agent switcher */}
        <div className='flex gap-1.5 overflow-x-auto no-scrollbar p-0.5'>
          {agents.map((agent) => {
            const isActive = selectedAgent === agent.label;
            const Icon = agent.icon;
            return (
              <button
                key={agent.id}
                onClick={() => setSelectedAgent(agent.label)}
                className={`shrink-0 inline-flex items-center gap-1.5 h-8 px-3.25 rounded-full border text-[13px] font-semibold cursor-pointer transition-colors
                  ${isActive
                    ? "bg-sage-200 text-sage-900 border-sage-400"
                    : "bg-transparent text-sand-800 border-line hover:bg-ink/6"
                  }`}
              >
                <Icon size={13} />
                {agent.label}
              </button>
            );
          })}
        </div>

        {/* Composer */}
        <div className='flex flex-col gap-2 py-3 pr-3 pl-4.5 rounded-panel bg-sand-100 shadow-soft-md'>
          {selectedFile && (
            <div className='self-start flex items-center gap-2.5 py-1.5 pr-1.5 pl-3 rounded-full bg-surface'>
              {selectedFile.type.startsWith("image/") ? (
                <img src={URL.createObjectURL(selectedFile)} className='w-6 h-6 rounded-full object-cover' alt="" />
              ) : (
                <FileText size={15} className='text-clay-700' />
              )}
              <span className='text-[13px] font-semibold max-w-55 truncate'>{selectedFile?.name}</span>
              <span className='text-xs text-sand-700'>{Math.ceil(selectedFile.size / 1024)} KB</span>
              <button
                type='button'
                title="Remove file"
                className='w-6 h-6 rounded-full grid place-items-center text-sand-700 hover:bg-sand-300 cursor-pointer'
                onClick={() => { setSelectedFile(null); if (fileRef.current) fileRef.current.value = ""; }}
              >
                <X size={13} />
              </button>
            </div>
          )}

          <textarea
            placeholder={selectedAgent === "Auto" ? "Ask anything…" : `Message the ${selectedAgent} agent…`}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            value={value}
            disabled={isLoading}
            rows={2}
            className='w-full bg-transparent border-none outline-none resize-none text-[15px] leading-relaxed pt-1.5 min-h-13 max-h-50 placeholder:text-sand-600 disabled:opacity-60'
          />

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
              title="Attach a PDF or image"
              className={`${iconBtn} text-sand-700 hover:bg-sand-200`}
              onClick={() => fileRef.current.click()}
            >
              <Paperclip size={17} />
            </button>
            <button
              type='button'
              title={listening ? "Stop dictation" : "Dictate"}
              onClick={toggleMic}
              className={`${iconBtn} ${listening ? "bg-clay-200 text-clay-800 hover:bg-clay-300" : "text-sand-700 hover:bg-sand-200"}`}
            >
              <Mic size={17} />
            </button>
            <div className='flex-1' />
            <span className='hidden md:inline text-xs text-sand-700 mr-2'>Enter to send · Shift + Enter for a new line</span>
            <button
              type='button'
              title="Send"
              onClick={() => handleSendMessage()}
              disabled={!canSend}
              className='w-10 h-10 rounded-full grid place-items-center bg-clay hover:bg-clay-600 active:bg-clay-700 text-canvas cursor-pointer transition-colors disabled:opacity-45 disabled:cursor-not-allowed disabled:hover:bg-clay'
            >
              <ArrowUp size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Chatinput
