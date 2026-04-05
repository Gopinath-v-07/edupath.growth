import React from 'react';
import { Link } from 'react-router-dom';
import { FiZap, FiMap, FiUsers, FiTrendingUp, FiAward, FiBookOpen, FiArrowRight, FiCheck, FiMic, FiStar } from 'react-icons/fi';
import '../styles/LandingPage.css';

const LandingPage = () => {
    return (
        <div className="landing-page">
            {/* ── HERO SECTION ── */}
            <section className="hero-section">
                <div className="hero-container">
                    <div className="hero-background">
                        <div className="gradient-blob blob-1"></div>
                        <div className="gradient-blob blob-2"></div>
                    </div>
                    
                    <div className="hero-content">
                        <div className="hero-badge">
                            <span className="badge-emoji">✨</span>
                            AI-Powered Learning Platform
                        </div>
                        
                        <h1 className="hero-title">
                            Your Personal <br />
                            <span className="gradient-text">Learning Assistant</span>
                        </h1>
                        
                        <p className="hero-description">
                            EduPath combines AI-driven skill assessment, personalized roadmaps, and 24/7 mentorship 
                            to accelerate your learning journey and career growth.
                        </p>
                        
                        <div className="hero-cta-group">
                            <Link to="/signup" className="btn btn-hero-primary">
                                Start Learning Free <FiArrowRight size={18} />
                            </Link>
                            <Link to="/login" className="btn btn-hero-secondary">
                                Sign In to Dashboard
                            </Link>
                        </div>
                        
                        <div className="hero-social-proof">
                            <div className="proof-stat">
                                <span className="proof-number">10,000+</span>
                                <span className="proof-label">Active Learners</span>
                            </div>
                            <div className="proof-divider"></div>
                            <div className="proof-stat">
                                <span className="proof-number">95%</span>
                                <span className="proof-label">Success Rate</span>
                            </div>
                            <div className="proof-divider"></div>
                            <div className="proof-stat">
                                <span className="proof-number">500+</span>
                                <span className="proof-label">Learning Paths</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Visual Element - Hero Image */}
                    <div className="hero-visual">
                        <img src="/img/hero.png" alt="Learning Dashboard" className="hero-image" />
                    </div>
                </div>
            </section>

            {/* ── STATS SHOWCASE SECTION ── */}
            <section className="stats-showcase-section">
                <div className="showcase-container">
                    <div className="showcase-text">
                        <h2 className="showcase-title">Transform Your Learning Journey</h2>
                        <p className="showcase-subtitle">Join thousands of learners who've achieved their goals with EduPath</p>
                        <div className="showcase-highlights">
                            <div className="highlight-item">
                                <FiCheck className="highlight-icon" />
                                <span>Adaptive learning paths tailored to your pace</span>
                            </div>
                            <div className="highlight-item">
                                <FiCheck className="highlight-icon" />
                                <span>Real-time progress tracking and analytics</span>
                            </div>
                            <div className="highlight-item">
                                <FiCheck className="highlight-icon" />
                                <span>24/7 AI mentor support</span>
                            </div>
                        </div>
                    </div>
                    <div className="showcase-image">
                        <img src="/images/learning_illustration_1772509815396.png" alt="Learning Platform" className="feature-showcase-img" />
                    </div>
                </div>
            </section>

            {/* ── FEATURES SECTION ── */}
            <section className="features-section">
                <div className="section-header">
                    <span className="section-tag">CORE FEATURES</span>
                    <h2 className="section-title">Everything you need to master any skill</h2>
                    <p className="section-subtitle">A complete ecosystem designed to transform your learning experience</p>
                </div>
                
                <div className="features-grid">
                    {/* Feature 1 */}
                    <div className="feature-item">
                        <div className="feature-icon-container blue">
                            <FiZap size={28} />
                        </div>
                        <h3 className="feature-title">AI Skill Analysis</h3>
                        <p className="feature-description">
                            Intelligent assessments map your knowledge gaps with precision. Get instant feedback on 
                            strengths and areas for improvement.
                        </p>
                        <ul className="feature-benefits">
                            <li><FiCheck size={16} /> Real-time skill scoring</li>
                            <li><FiCheck size={16} /> Visual progress radar</li>
                            <li><FiCheck size={16} /> Benchmark comparisons</li>
                        </ul>
                    </div>

                    {/* Feature 2 */}
                    <div className="feature-item">
                        <div className="feature-icon-container indigo">
                            <FiMap size={28} />
                        </div>
                        <h3 className="feature-title">Adaptive Roadmaps</h3>
                        <p className="feature-description">
                            Learning paths that evolve with your pace. Our AI continuously adjusts difficulty, 
                            pacing, and content based on your performance.
                        </p>
                        <ul className="feature-benefits">
                            <li><FiCheck size={16} /> Personalized curriculum</li>
                            <li><FiCheck size={16} /> Flexible scheduling</li>
                            <li><FiCheck size={16} /> Goal-aligned learning</li>
                        </ul>
                    </div>

                    {/* Feature 3 */}
                    <div className="feature-item">
                        <div className="feature-icon-container green">
                            <FiTrendingUp size={28} />
                        </div>
                        <h3 className="feature-title">Real-Time Progress</h3>
                        <p className="feature-description">
                            Track your growth with detailed analytics and insights. Monitor weekly performance trends 
                            and career readiness metrics.
                        </p>
                        <ul className="feature-benefits">
                            <li><FiCheck size={16} /> Weekly progress reports</li>
                            <li><FiCheck size={16} /> Performance analytics</li>
                            <li><FiCheck size={16} /> Career readiness score</li>
                        </ul>
                    </div>

                    {/* Feature 4 */}
                    <div className="feature-item">
                        <div className="feature-icon-container orange">
                            <FiUsers size={28} />
                        </div>
                        <h3 className="feature-title">Group Collaboration</h3>
                        <p className="feature-description">
                            Learn together with focused study groups. Compete on leaderboards, share insights, 
                            and celebrate milestones with peers.
                        </p>
                        <ul className="feature-benefits">
                            <li><FiCheck size={16} /> Collaborative groups</li>
                            <li><FiCheck size={16} /> Live leaderboards</li>
                            <li><FiCheck size={16} /> Shared resources</li>
                        </ul>
                    </div>

                    {/* Feature 5 */}
                    <div className="feature-item">
                        <div className="feature-icon-container purple">
                            <FiAward size={28} />
                        </div>
                        <h3 className="feature-title">Smart Assessments</h3>
                        <p className="feature-description">
                            Comprehensive quizzes and checkpoints that ensure measurable progress. Adaptive difficulty 
                            provides the right challenge level.
                        </p>
                        <ul className="feature-benefits">
                            <li><FiCheck size={16} /> Adaptive quizzes</li>
                            <li><FiCheck size={16} /> Skill validation</li>
                            <li><FiCheck size={16} /> Completion badges</li>
                        </ul>
                    </div>

                    {/* Feature 6 */}
                    <div className="feature-item">
                        <div className="feature-icon-container teal">
                            <FiMic size={28} />
                        </div>
                        <h3 className="feature-title">AI Mentor 24/7</h3>
                        <p className="feature-description">
                            Always-available AI tutor for your questions. Get instant explanations, code reviews, 
                            and concept clarifications anytime.
                        </p>
                        <ul className="feature-benefits">
                            <li><FiCheck size={16} /> Instant answers</li>
                            <li><FiCheck size={16} /> Code explanations</li>
                            <li><FiCheck size={16} /> Concept deep-dives</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* ── MENTORING SECTION ── */}
            <section className="mentoring-section">
                <div className="mentoring-container">
                    <div className="mentoring-image">
                        <img src="/images/mentoring_illustration_1772509833548.png" alt="AI Mentoring" className="mentoring-img" />
                    </div>
                    <div className="mentoring-content">
                        <span className="section-tag">AI POWERED</span>
                        <h2 className="mentoring-title">24/7 AI Mentor Support</h2>
                        <p className="mentoring-description">
                            Get instant help whenever you need it. Our advanced AI mentor understands your learning context and provides personalized explanations.
                        </p>
                        <ul className="mentoring-features">
                            <li>
                                <FiCheck />
                                <span>Instant code reviews and explanations</span>
                            </li>
                            <li>
                                <FiCheck />
                                <span>Personalized learning recommendations</span>
                            </li>
                            <li>
                                <FiCheck />
                                <span>Real-time concept clarifications</span>
                            </li>
                            <li>
                                <FiCheck />
                                <span>Interview preparation and guidance</span>
                            </li>
                        </ul>
                        <Link to="/mentor" className="btn btn-secondary">
                            Try AI Mentor <FiArrowRight size={18} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── COMMUNITY SECTION ── */}
            <section className="community-section">
                <div className="community-container">
                    <div className="community-content">
                        <span className="section-tag">COLLABORATE</span>
                        <h2 className="community-title">Learn Together, Grow Faster</h2>
                        <p className="community-description">
                            Join study groups, participate in challenges, and connect with fellow learners. Collaboration accelerates growth.
                        </p>
                        <ul className="community-features">
                            <li>
                                <FiUsers />
                                <span>Organized study groups by skill level</span>
                            </li>
                            <li>
                                <FiTrendingUp />
                                <span>Compete in weekly challenges</span>
                            </li>
                            <li>
                                <FiAward />
                                <span>Earn badges and certificates</span>
                            </li>
                            <li>
                                <FiStar />
                                <span>Access peer-reviewed solutions</span>
                            </li>
                        </ul>
                        <Link to="/groups" className="btn btn-primary">
                            Join a Group <FiArrowRight size={18} />
                        </Link>
                    </div>
                    <div className="community-image">
                        <img src="/images/community_illustration_1772509850820.png" alt="Community" className="community-img" />
                    </div>
                </div>
            </section>

            {/* ── TESTIMONIALS ── */}
            <section className="testimonials-section">
                <div className="section-header">
                    <span className="section-tag">TESTIMONIALS</span>
                    <h2 className="section-title">Loved by learners worldwide</h2>
                </div>
                
                <div className="testimonials-grid">
                    <div className="testimonial-card">
                        <div className="testimonial-header">
                            <div className="stars">★★★★★</div>
                            <span className="verified-badge">✓ Verified</span>
                        </div>
                        <p className="testimonial-text">
                            "EduPath completely transformed how I approach learning. The personalized roadmap helped me go from beginner to intermediate in Python in just 3 months!"
                        </p>
                        <div className="testimonial-author">
                            <div className="author-avatar">SC</div>
                            <div>
                                <div className="author-name">Sarah Chen</div>
                                <div className="author-title">Software Engineer</div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="testimonial-card">
                        <div className="testimonial-header">
                            <div className="stars">★★★★★</div>
                            <span className="verified-badge">✓ Verified</span>
                        </div>
                        <p className="testimonial-text">
                            "The AI mentor feature is incredible. I can ask any question and get detailed explanations instantly. It's like having a tutor available 24/7!"
                        </p>
                        <div className="testimonial-author">
                            <div className="author-avatar">MJ</div>
                            <div>
                                <div className="author-name">Michael Johnson</div>
                                <div className="author-title">Data Scientist</div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="testimonial-card">
                        <div className="testimonial-header">
                            <div className="stars">★★★★★</div>
                            <span className="verified-badge">✓ Verified</span>
                        </div>
                        <p className="testimonial-text">
                            "The group collaboration feature helped me stay accountable and motivated. I've made friends and learned so much from other members!"
                        </p>
                        <div className="testimonial-author">
                            <div className="author-avatar">AP</div>
                            <div>
                                <div className="author-name">Amelia Patel</div>
                                <div className="author-title">Product Manager</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── PRICING PREVIEW ── */}
            <section className="pricing-section">
                <div className="section-header">
                    <span className="section-tag">PRICING</span>
                    <h2 className="section-title">Start for Free, Upgrade Anytime</h2>
                    <p className="section-subtitle">Begin your learning journey without any commitment</p>
                </div>
                
                <div className="pricing-grid">
                    <div className="pricing-card">
                        <div className="plan-name">Free</div>
                        <div className="plan-price">$0</div>
                        <p className="plan-period">Forever</p>
                        <ul className="plan-features">
                            <li><FiCheck /> Basic skill assessment</li>
                            <li><FiCheck /> Access to sample courses</li>
                            <li><FiCheck /> Community groups</li>
                            <li className="disabled"><FiCheck /> Adaptive roadmaps</li>
                            <li className="disabled"><FiCheck /> AI mentor support</li>
                        </ul>
                        <Link to="/signup" className="btn btn-secondary">Get Started</Link>
                    </div>
                    
                    <div className="pricing-card featured">
                        <div className="badge-featured">MOST POPULAR</div>
                        <div className="plan-name">Pro</div>
                        <div className="plan-price">$9.99<span>/month</span></div>
                        <p className="plan-period">Billed monthly</p>
                        <ul className="plan-features">
                            <li><FiCheck /> Everything in Free</li>
                            <li><FiCheck /> Full course library</li>
                            <li><FiCheck /> Personalized learning paths</li>
                            <li><FiCheck /> 24/7 AI mentor</li>
                            <li><FiCheck /> Progress tracking</li>
                        </ul>
                        <Link to="/signup" className="btn btn-primary">Start Free Trial</Link>
                    </div>
                    
                    <div className="pricing-card">
                        <div className="plan-name">Team</div>
                        <div className="plan-price">Custom</div>
                        <p className="plan-period">Contact sales</p>
                        <ul className="plan-features">
                            <li><FiCheck /> Everything in Pro</li>
                            <li><FiCheck /> Team dashboard</li>
                            <li><FiCheck /> Admin controls</li>
                            <li><FiCheck /> Priority support</li>
                            <li><FiCheck /> Custom integrations</li>
                        </ul>
                        <Link to="/groups" className="btn btn-secondary">Contact Us</Link>
                    </div>
                </div>
            </section>

            {/* ── CTA SECTION ── */}
            <section className="cta-section">
                <div className="cta-container">
                    <h2 className="cta-title">Ready to Transform Your Learning?</h2>
                    <p className="cta-subtitle">Join thousands of students accelerating their careers with personalized, AI-powered learning.</p>
                    <div className="cta-buttons">
                        <Link to="/signup" className="btn btn-large btn-primary">
                            Start Free Today <FiArrowRight size={20} />
                        </Link>
                        <Link to="/login" className="btn btn-large btn-secondary">
                            Sign In
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;
