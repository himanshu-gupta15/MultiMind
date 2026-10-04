import { Coins, Menu, PanelRight } from 'lucide-react';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setArtifactOpen, setBillingOpen, setMobileArtifactOpen, setSidebarOpen } from '../redux/uiSlice';

function Nav() {
    const dispatch = useDispatch();
    const { selectedConversation } = useSelector((state) => state.conversation);
    const { userData } = useSelector((state) => state.user);
    const { artifactOpen } = useSelector((state) => state.ui);
    const messages = useSelector((state) => state.message.message) || [];
    const artifacts = useSelector((state) => state.message.artifacts) || [];
    const hasArtifacts = artifacts.length > 0;

    const pillBtn = 'h-9 px-3.5 flex items-center gap-1.5 rounded-full border border-line text-[13px] font-semibold hover:bg-ink/7 cursor-pointer shrink-0 transition-colors';

    return (
        <header className='h-16 shrink-0 flex items-center gap-3 px-4 md:px-6.5'>
            <button
                className='lg:hidden -ml-2 w-9 h-9 rounded-full grid place-items-center hover:bg-ink/7 cursor-pointer'
                onClick={() => dispatch(setSidebarOpen(true))}
                title="Open menu"
            >
                <Menu size={18} />
            </button>
            <div className='flex-1 min-w-0 flex items-center gap-3'>
                <h1 className='m-0 font-display text-[19px] leading-tight truncate'>
                    {selectedConversation?.title || "New chat"}
                </h1>
                {messages.length > 0 && (
                    <span className='hidden sm:inline-flex shrink-0 px-2.5 py-0.5 rounded-xl bg-sand-100 text-sand-800 text-[11px]'>
                        {messages.length} {messages.length === 1 ? "message" : "messages"}
                    </span>
                )}
            </div>
            {hasArtifacts && (
                <>
                    {!artifactOpen && (
                        <button className={`${pillBtn} hidden lg:flex`} onClick={() => dispatch(setArtifactOpen(true))}>
                            <PanelRight size={15} />
                            Preview
                        </button>
                    )}
                    <button className={`${pillBtn} lg:hidden`} onClick={() => dispatch(setMobileArtifactOpen(true))}>
                        <PanelRight size={15} />
                        Preview
                    </button>
                </>
            )}
            {userData && (
                <button className={`${pillBtn} text-sage-800`} onClick={() => dispatch(setBillingOpen(true))} title="Credits">
                    <Coins size={15} />
                    {userData?.credits || 0}
                </button>
            )}
        </header>
    );
}

export default Nav;
