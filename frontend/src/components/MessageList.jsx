import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import LoadingAnimation from './LoadingAnimation';
import MessageBubble from './MessageBubble';

function MessageList() {
    const { selectedConversation } = useSelector(state => state.conversation);
    const { message: messages, isLoading } = useSelector(state => state.message);
    const bottomRef = useRef(null);

    useEffect(() => {
        requestAnimationFrame(() => {
            if (bottomRef.current) {
                bottomRef.current.scrollIntoView({
                    behavior: "smooth",
                    block: "end"
                });
            }
        });
    }, [messages?.length, isLoading]);

    return (
        <div className='flex-1 overflow-y-auto px-6 py-6 space-y-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
            {(!messages || messages.length === 0) ? (
                <div className='h-full flex flex-col items-center justify-center gap-5 text-center px-4'>
                    <div className='flex flex-col gap-1.5 items-center'>
                        <h1 className='text-5xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 mb-2 drop-shadow-[0_2px_12px_rgba(167,139,250,0.15)]'>
                            MultiMind
                        </h1>
                        <p className='text-[16px] font-semibold text-slate-300 tracking-wide mt-2'>
                            How can I help you today?
                        </p>
                        <p className='text-slate-500 text-[13.5px] max-w-sm leading-relaxed mt-1'>
                            Ask me anything - code, explanations, document analysis, or internet searches.
                        </p>
                    </div>
                    <div className='flex flex-wrap gap-2.5 justify-center mt-6 max-w-xl'>
                        {["Write a Netflix clone", "Explain Redis", "Build a dashboard"].map((s) => (
                            <button
                                key={s}
                                className='text-xs font-medium text-slate-300 bg-white/[0.02] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.12] px-4.5 py-2.5 rounded-xl transition-all duration-200 shadow-md backdrop-blur-md cursor-pointer hover:-translate-y-0.5'
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <div className='space-y-5'>
                    {messages.map((msg, i) => (
                        <div key={i}>
                            <MessageBubble role={msg?.role} content={msg?.content} images={msg?.images} />
                        </div>
                    ))}
                    {isLoading && <LoadingAnimation />}
                    <div ref={bottomRef} />
                </div>
            )}
        </div>
    );
}

export default MessageList;