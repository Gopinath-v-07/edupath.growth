import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchMe } from '../services/api';

import './Dashboard.css';

const Dashboard = () => {
    const [loading, setLoading] = useState(true);
    const [userProfile, setUserProfile] = useState(null);
    const [streak, setStreak] = useState({ current_streak: 0, longest_streak: 0 });
    const navigate = useNavigate();

    useEffect(() => {
        const initDashboard = async () => {
            try {
                const userRes = await fetchMe();
                if (!userRes.data.has_profile) {
                    navigate('/complete-profile');
                    return;
                }
                setUserProfile(userRes.data.profile);
                if (userRes.data.streak) {
                    setStreak(userRes.data.streak);
                }
            } catch (error) {
                console.error("Error initializing dashboard:", error);
            } finally {
                setLoading(false);
            }
        };
        initDashboard();
    }, [navigate]);

    const getStreakMessage = (count) => {
        if (count === 0) return "Login daily to build your streak!";
        if (count === 1) return "Great start! Come back tomorrow.";
        if (count < 5)  return "You're building momentum!";
        if (count < 10) return "You're on fire! Keep it up!";
        if (count < 30) return "Incredible consistency! 🏆";
        return "Legendary dedication! 🌟";
    };

    return (
        <main className="dash-main-area animate-fade-in">
                {loading ? (
                    <div className="loading-state">Syncing workspace data...</div>
                ) : (
                    <div className="dash-container">

                        {/* Welcome Header */}
                        <header className="dash-welcome-section">
                            <div className="dash-header-top">
                                <h1 className="dash-title">
                                    Welcome back, {userProfile?.full_name || 'Learner'}!
                                </h1>
                                <button className="btn btn-secondary switch-goal-btn" onClick={() => navigate('/goals')}>
                                    Switch Goal
                                </button>
                            </div>
                            <p className="dash-subtitle">
                                Transform your learning journey with AI-powered guidance and real project experience.
                            </p>
                        </header>

                        {/* Streak Banner */}
                        <div className="streak-banner">
                            <div className="streak-flame-section">
                                <span className="streak-fire">{streak.current_streak > 0 ? '🔥' : '💤'}</span>
                                <div className="streak-info">
                                    <span className="streak-count">{streak.current_streak} Day Streak</span>
                                    <span className="streak-msg">{getStreakMessage(streak.current_streak)}</span>
                                </div>
                            </div>
                            <div className="streak-best">
                                <span className="streak-best-label">Best</span>
                                <span className="streak-best-count">🏆 {streak.longest_streak} days</span>
                            </div>
                        </div>

                        <div className="dash-action-section">
                            <h3 className="section-heading">Where to start...</h3>

                            <div className="action-cards-grid">

                                {/* Card 1: Continue Learning */}
                                <div className="action-card" onClick={() => navigate('/roadmap')}>
                                    <div className="card-img-wrapper">
                                        <img src="/images/learning_illustration_1772509815396.png" alt="Continue Learning" />
                                    </div>
                                    <div className="card-title">Continue learning on your tracks</div>
                                </div>

                                {/* Card 2: Mentoring */}
                                <div className="action-card" onClick={() => navigate('/mentor')}>
                                    <div className="card-img-wrapper">
                                        <img src="/images/mentoring_illustration_1772509833548.png" alt="Mentoring" />
                                    </div>
                                    <div className="card-title">Try your hand at mentoring</div>
                                </div>

                                {/* Card 3: Community */}
                                <div className="action-card" onClick={() => navigate('/groups')}>
                                    <div className="card-img-wrapper">
                                        <img src="/images/community_illustration_1772509850820.png" alt="Community" />
                                    </div>
                                    <div className="card-title">Get involved in the community</div>
                                </div>

                            </div>
                        </div>

                    </div>
                )}
        </main>
    );
};

export default Dashboard;
