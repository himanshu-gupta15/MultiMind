import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Code2, MessageSquare } from 'lucide-react';
import LoadingAnimation from './LoadingAnimation';
import MessageBubble from './MessageBubble';
import { setPendingPrompt } from '../redux/messageSlice';

const SUGGESTIONS = [
    { title: "Write a Netflix clone", desc: "A responsive landing page with a hero, rows and a modal.", agent: "Coding", icon: Code2, tint: "bg-sage-200 text-sage-800" },
    { title: "Explain Redis", desc: "What it is, when to use it and the main caching patterns.", agent: "Chat", icon: MessageSquare, tint: "bg-clay-200 text-clay-800" },
    { title: "Build a dashboard", desc: "KPI cards and a revenue chart in plain HTML, CSS and JS.", agent: "Coding", icon: Code2, tint: "bg-sage-200 text-sage-800" }
];

function MessageList() {
    const dispatch = useDispatch();
    const { message: messages, isLoading } = useSelector(state => state.message);
    const { userData } = useSelector(state => state.user);
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

    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
    const firstName = userData?.name?.split(" ")[0];
    const isEmpty = !messages || messages.length === 0;

    return (
        <div className='flex-1 min-h-0 overflow-y-auto'>
            <div className='max-w-195 mx-auto min-h-full flex flex-col px-4 md:px-6.5 pt-6 pb-9'>
                {isEmpty ? (
                    <div className='flex-1 flex flex-col justify-center gap-6.5 relative py-9'>
                        <div className='absolute -right-10 top-[8%] w-55 h-55 rounded-full bg-sage-200 opacity-70 pointer-events-none' />
                        <div className='absolute right-30 top-[30%] w-18 h-18 rounded-full bg-clay-300 opacity-60 pointer-events-none' />
                        <div className='relative flex flex-col gap-3 max-w-135'>
                            <h2 className='m-0 font-display text-[clamp(34px,5vw,50px)] leading-[1.05] text-pretty'>
                                Good {timeOfDay}{firstName ? `, ${firstName}` : ""}.
                            </h2>
                            <p className='m-0 text-[17px] leading-relaxed text-sand-800 text-pretty'>
                                Write code, read a PDF, build slides or search the web. Pick an agent below, or let Auto choose.
                            </p>
                        </div>
                        <div className='relative grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-3'>
                            {SUGGESTIONS.map(({ title, desc, agent, icon: Icon, tint }) => (
                                <button
                                    key={title}
                                    onClick={() => dispatch(setPendingPrompt({ text: title, agent }))}
                                    className='flex flex-col items-start gap-2.5 p-4.5 rounded-panel bg-surface text-left cursor-pointer transition-[transform,box-shadow] duration-150 hover:shadow-soft-md hover:-translate-y-0.5'
                                >
                                    <span className={`w-9 h-9 rounded-full grid place-items-center ${tint}`}>
                                        <Icon size={16} />
                                    </span>
                                    <span className='text-[15px] font-semibold'>{title}</span>
                                    <span className='text-[13px] leading-snug text-sand-700'>{desc}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className='flex flex-col gap-9'>
                        {messages.map((msg, i) => (
                            <MessageBubble key={i} role={msg?.role} content={msg?.content} images={msg?.images} artifacts={msg?.artifacts} />
                        ))}
                        {isLoading && <LoadingAnimation />}
                        <div ref={bottomRef} />
                    </div>
                )}
            </div>
        </div>
    );
}

export default MessageList;
