import React, { useState, useRef, useEffect } from 'react';
import { FiSend, FiMessageSquare } from 'react-icons/fi';
import { chatWithMentor } from '../services/api';
import './AIChatbot.css';

const AIChatbot = ({ userProfile }) => {
    const [messages, setMessages] = useState([
        { role: 'mentor', content: `Hello ${userProfile?.full_name?.split(' ')[0] || 'there'}! I'm your AI Mentor for EduPath. How can I assist you with your goal of "${userProfile?.short_term_goal || 'learning'}" today?` }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = input.trim();
        setInput('');

        // Add user message to UI
        const newMessages = [...messages, { role: 'user', content: userMsg }];
        setMessages(newMessages);
        setIsLoading(true);

        try {
            // Prepare history for API (last 5 messages to save tokens)
            const history = messages.slice(-5).map(m => ({ role: m.role, content: m.content }));

            const response = await chatWithMentor({
                message: userMsg,
                history: history
            });

            if (response.data && response.data.response) {
                setMessages([...newMessages, { role: 'mentor', content: response.data.response }]);
            }
        } catch (error) {
            console.error("Chat error:", error);
            setMessages([...newMessages, {
                role: 'mentor',
                content: "I'm having trouble connecting right now. Let's try again in a moment.",
                isError: true
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="ai-chatbot-container">
            <div className="chat-messages">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`chat-message ${msg.role === 'user' ? 'msg-user' : 'msg-mentor'} ${msg.isError ? 'msg-error' : ''}`}>
                        <div className="msg-bubble">
                            {msg.content}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="chat-message msg-mentor">
                        <div className="msg-bubble typing-indicator">
                            <span></span><span></span><span></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-area">
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask your mentor a question..."
                    rows={1}
                />
                <button
                    className="send-btn"
                    onClick={handleSend}
                    disabled={isLoading || !input.trim()}
                >
                    <FiSend />
                </button>
            </div>
        </div>
    );
};

export default AIChatbot;
