import React from 'react';
import { Link } from 'react-router-dom';
import { FiZap, FiMap, FiUsers, FiTrendingUp, FiAward, FiBookOpen, FiArrowRight } from 'react-icons/fi';
import './Home.css';

const Home = () => {
    return (
        <div className="home-wrapper animate-fade-in">

            {/* ── Hero ── */}
            <section className="home-hero">
                <div className="hero-badge">🎓 AI-Powered Learning Platform</div>
                <h1 className="hero-title">
                    Smarter Learning<br />
                    <span className="hero-title-accent">Starts Here</span>
                </h1>
                <p className="hero-subtitle">
                    EduPath delivers personalized AI-powered roadmaps, skill analysis, and mentorship — adapting to your pace, goals, and career ambitions.
                </p>
                <div className="hero-actions">
                    <Link to="/signup" className="btn hero-btn-primary">
                        Get Started Free <FiArrowRight />
                    </Link>
                    <Link to="/login" className="btn btn-secondary hero-btn-secondary">
                        Sign In
                    </Link>
                </div>

                {/* Stats Row */}
                <div className="hero-stats">
                    <div className="hero-stat"><span className="hero-stat-num">10k+</span><span>Learners</span></div>
                    <div className="hero-stat-divider" />
                    <div className="hero-stat"><span className="hero-stat-num">500+</span><span>Courses</span></div>
                    <div className="hero-stat-divider" />
                    <div className="hero-stat"><span className="hero-stat-num">95%</span><span>Success Rate</span></div>
                </div>
            </section>

            {/* ── Feature Cards ── */}
            <section className="home-features">
                <p className="section-label">WHAT WE OFFER</p>
                <h2 className="section-title">Everything you need to grow</h2>
                <div className="feature-grid">
                    <div className="feature-card">
                        <div className="feature-icon-box blue">
                            <FiZap size={22} />
                        </div>
                        <h3>AI Skill Analysis</h3>
                        <p>Instantly map your knowledge gaps with AI-powered assessments and visual skill radar charts.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon-box indigo">
                            <FiMap size={22} />
                        </div>
                        <h3>Adaptive Roadmaps</h3>
                        <p>Dynamic learning paths that evolve with your pace, performance, and career goals.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon-box green">
                            <FiTrendingUp size={22} />
                        </div>
                        <h3>Progress Tracking</h3>
                        <p>Real-time performance insights with growth trends and weekly Career Readiness Index.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon-box orange">
                            <FiUsers size={22} />
                        </div>
                        <h3>Group Study</h3>
                        <p>Collaborate in focused study groups with leaderboards and shared learning milestones.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon-box purple">
                            <FiAward size={22} />
                        </div>
                        <h3>Assessments & Quizzes</h3>
                        <p>Structured checkpoints that ensure measurable skill progression at every stage.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon-box teal">
                            <FiBookOpen size={22} />
                        </div>
                        <h3>AI Mentor Chat</h3>
                        <p>Ask anything, get personalized guidance and concept explanations 24/7 from your AI mentor.</p>
                    </div>
                </div>
            </section>

            {/* ── CTA Banner ── */}
            <section className="home-cta">
                <div className="cta-content">
                    <h2>Ready to transform your learning journey?</h2>
                    <p>Join thousands of learners already growing with EduPath.</p>
                    <Link to="/signup" className="btn cta-btn">
                        Start Learning Today <FiArrowRight />
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default Home;
