import React, { useState, useEffect } from 'react';
import { fetchMe } from '../services/api';
import AIChatbot from '../components/AIChatbot';
import { FiMessageCircle } from 'react-icons/fi';
import './AIMentor.css';

const AIMentor = () => {
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initMentor = async () => {
            try {
                const userRes = await fetchMe();
                setUserProfile(userRes.data.profile);
            } catch (error) {
                console.error("Error fetching profile", error);
            } finally {
                setLoading(false);
            }
        };
        initMentor();
    }, []);

    return (
        <main className="mentor-main animate-fade-in">
                {loading ? (
                    <div className="loading-state">Loading your mentor...</div>
                ) : (
                    <div className="mentor-full-container">
                        <header className="mentor-header">
                            <FiMessageCircle size={32} color="var(--primary)" />
                            <div>
                                <h2>AI Mentor</h2>
                                <p>Your personal guide for achieving: <strong>{userProfile?.short_term_goal || 'your goals'}</strong></p>
                            </div>
                        </header>

                        <div className="chatbot-wrapper">
                            <AIChatbot userProfile={userProfile} />
                        </div>
                    </div>
                )}
            </main>
    );
};

export default AIMentor;
