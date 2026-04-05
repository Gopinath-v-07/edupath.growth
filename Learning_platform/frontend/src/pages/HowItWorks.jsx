import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    FiUserPlus, FiClipboard, FiTarget, FiZap, FiMap,
    FiBookOpen, FiAward, FiMessageSquare, FiTrendingUp,
    FiUsers, FiArrowRight, FiCheck, FiChevronDown
} from 'react-icons/fi';
import './HowItWorks.css';

/* ── Animated counter hook ── */
const useCounter = (target, duration = 1500, active = false) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
        if (!active) return;
        let start = 0;
        const step = target / (duration / 16);
        const timer = setInterval(() => {
            start += step;
            if (start >= target) { setCount(target); clearInterval(timer); }
            else setCount(Math.floor(start));
        }, 16);
        return () => clearInterval(timer);
    }, [target, duration, active]);
    return count;
};

/* ── Intersection observer hook ── */
const useInView = () => {
    const ref = useRef(null);
    const [inView, setInView] = useState(false);
    useEffect(() => {
        const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold: 0.2 });
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, []);
    return [ref, inView];
};

/* ── FAQ Item ── */
const FAQItem = ({ q, a }) => {
    const [open, setOpen] = useState(false);
    return (
        <div className={`hiw-faq-item ${open ? 'open' : ''}`} onClick={() => setOpen(!open)}>
            <div className="hiw-faq-q">
                <span>{q}</span>
                <FiChevronDown className={`hiw-faq-chevron ${open ? 'rotated' : ''}`} />
            </div>
            {open && <div className="hiw-faq-a">{a}</div>}
        </div>
    );
};

const HowItWorks = () => {
    const [statsRef, statsInView] = useInView();
    const c1 = useCounter(10000, 1800, statsInView);
    const c2 = useCounter(95, 1500, statsInView);
    const c3 = useCounter(500, 1600, statsInView);
    const c4 = useCounter(24, 1200, statsInView);

    const steps = [
        {
            num: '01', icon: <FiUserPlus size={28} />, color: 'blue',
            title: 'Create Your Account',
            subtitle: 'Sign up in 30 seconds',
            desc: 'Register with your email. No credit card required — your first path is completely free.',
            bullets: ['Instant email registration', 'Secure JWT authentication', 'No commitments needed'],
            link: '/signup', linkLabel: 'Sign Up Free'
        },
        {
            num: '02', icon: <FiClipboard size={28} />, color: 'indigo',
            title: 'Complete Your Profile',
            subtitle: 'Tell us about yourself',
            desc: 'Share your academic background — stream, department, year of study — so EduPath can tailor everything to your context.',
            bullets: ['Academic details (stream, dept, year)', 'Confidence self-rating', 'Preferred learning mode'],
            link: '/onboarding', linkLabel: 'See Onboarding'
        },
        {
            num: '03', icon: <FiTarget size={28} />, color: 'green',
            title: 'Set Your Goals',
            subtitle: 'Short-term & long-term vision',
            desc: 'Define what you want to achieve — pass exams, land an internship, become a Software Engineer. Your goals drive every recommendation.',
            bullets: ['Short-term goals (weeks–months)', 'Long-term career aspirations', 'Goal-aligned curriculum generation'],
            link: '/goals', linkLabel: 'Set Goals'
        },
        {
            num: '04', icon: <FiZap size={28} />, color: 'orange',
            title: 'Take the Skill Assessment',
            subtitle: 'Know where you stand',
            desc: 'Answer adaptive questions across your domain. EduPath maps your knowledge gaps and classifies each skill as Foundation, Basic, Intermediate, or Advanced.',
            bullets: ['Adaptive multi-category questions', 'Instant skill classification', 'Visual radar chart of strengths'],
            link: '/assessment', linkLabel: 'Try Assessment'
        },
        {
            num: '05', icon: <FiMap size={28} />, color: 'purple',
            title: 'AI Generates Your Roadmap',
            subtitle: 'Your personalised learning path',
            desc: 'Based on your goals and assessment score, our AI (powered by GPT-4) creates a complete, modular curriculum — structured topics, resources, and timelines.',
            bullets: ['GPT-4 powered curriculum builder', 'Modular topic sequencing', 'Syllabus or skill-based modes'],
            link: '/roadmap', linkLabel: 'View Roadmap'
        },
        {
            num: '06', icon: <FiBookOpen size={28} />, color: 'teal',
            title: 'Study Topic by Topic',
            subtitle: 'Structured, unlockable content',
            desc: 'Progress through your roadmap topic by topic. Each lesson locks the next until mastered, ensuring solid foundations before moving forward.',
            bullets: ['Sequential topic unlocking', 'Rich markdown content', 'Estimated time per topic'],
            link: '/roadmap', linkLabel: 'Start Learning'
        },
        {
            num: '07', icon: <FiAward size={28} />, color: 'rose',
            title: 'Take Topic Quizzes',
            subtitle: 'Validate what you learned',
            desc: 'Each topic ends with an adaptive quiz. Pass to unlock the next module. Failed quizzes refine the AI\'s understanding of your weak areas.',
            bullets: ['Auto-generated quiz questions', 'Pass / retry flow', 'Score tracked to career readiness'],
            link: '/dashboard', linkLabel: 'See Dashboard'
        },
        {
            num: '08', icon: <FiMessageSquare size={28} />, color: 'cyan',
            title: 'Ask Your AI Mentor',
            subtitle: '24/7 personalised support',
            desc: 'Stuck on a concept? Ask the AI Mentor. It knows your roadmap context and gives targeted explanations, code help, and interview tips.',
            bullets: ['Context-aware responses', 'Code review & explanations', 'Interview prep guidance'],
            link: '/mentor', linkLabel: 'Try AI Mentor'
        },
        {
            num: '09', icon: <FiTrendingUp size={28} />, color: 'emerald',
            title: 'Track Your Progress',
            subtitle: 'Analytics & career readiness',
            desc: 'Your progress page shows hours spent, quiz averages, completed courses, and a Career Readiness Index — updated in real time.',
            bullets: ['Career Readiness Index (CRI)', 'Monthly hours chart', 'Skill radar visualization'],
            link: '/analysis', linkLabel: 'View Analytics'
        },
        {
            num: '10', icon: <FiUsers size={28} />, color: 'amber',
            title: 'Collaborate in Groups',
            subtitle: 'Learn faster together',
            desc: 'Join or create study groups. Log study sessions, compete on leaderboards, take group challenges, and share knowledge with peers.',
            bullets: ['Study session logging', 'Group leaderboards', 'Collaborative challenges'],
            link: '/groups', linkLabel: 'Join a Group'
        },
    ];

    const faqs = [
        { q: 'Is EduPath completely free to start?', a: 'Yes — sign up and start learning instantly with no credit card required. Free accounts get access to basic skill assessment, one AI-generated roadmap, and community groups.' },
        { q: 'How does the AI generate my roadmap?', a: 'After your skill assessment, EduPath sends your goals, academic profile, and skill scores to GPT-4. It responds with a structured curriculum — topics, descriptions, estimated durations — which we store and display as your personal roadmap.' },
        { q: 'What happens if I fail a quiz?', a: 'Failing a quiz does not block you — it feeds back into the AI\'s model of your strengths. Your career readiness score updates and the mentor\'s context improves so it can better target your weaknesses next time.' },
        { q: 'Can I create multiple learning roadmaps?', a: 'Yes. You can generate multiple roadmaps for different skills or subjects (e.g., Python, Data Structures, Web Dev). Each appears in your Roadmap Overview page.' },
        { q: 'How is the Career Readiness Index (CRI) calculated?', a: 'CRI is a weighted composite of your domain skill (40%), practical/problem-solving (20%), aptitude (15%), communication (15%), and project exposure (10%). It updates each time you take a quiz or complete a topic.' },
        { q: 'What is the AI Mentor and how does it know my context?', a: 'The AI Mentor is a GPT-4 powered chat that has access to your current skill scores and roadmap goals. Every message is enriched with this context, so answers are relevant to what you\'re studying — not generic.' },
    ];

    return (
        <div className="hiw-page">

            {/* ── HERO ── */}
            <section className="hiw-hero">
                <div className="hiw-hero-blobs">
                    <div className="hiw-blob hiw-blob-1" />
                    <div className="hiw-blob hiw-blob-2" />
                </div>
                <div className="hiw-hero-inner">
                    <span className="hiw-tag">THE FULL JOURNEY</span>
                    <h1 className="hiw-hero-title">How <span className="hiw-gradient-text">EduPath</span> Works</h1>
                    <p className="hiw-hero-sub">
                        From sign-up to career-ready — a complete, AI-powered learning loop designed
                        to accelerate your growth with personalised roadmaps, adaptive quizzes, and 24/7 mentorship.
                    </p>
                    <div className="hiw-hero-ctas">
                        <Link to="/signup" className="hiw-btn hiw-btn-primary">Get Started Free <FiArrowRight /></Link>
                        <a href="#journey" className="hiw-btn hiw-btn-ghost">See the Journey <FiChevronDown /></a>
                    </div>
                </div>
            </section>

            {/* ── STATS ── */}
            <section className="hiw-stats-bar" ref={statsRef}>
                <div className="hiw-stats-inner">
                    <div className="hiw-stat"><span className="hiw-stat-num">{statsInView ? c1.toLocaleString() : '0'}+</span><span className="hiw-stat-label">Active Learners</span></div>
                    <div className="hiw-stat-divider" />
                    <div className="hiw-stat"><span className="hiw-stat-num">{statsInView ? c2 : '0'}%</span><span className="hiw-stat-label">Success Rate</span></div>
                    <div className="hiw-stat-divider" />
                    <div className="hiw-stat"><span className="hiw-stat-num">{statsInView ? c3 : '0'}+</span><span className="hiw-stat-label">Learning Paths</span></div>
                    <div className="hiw-stat-divider" />
                    <div className="hiw-stat"><span className="hiw-stat-num">{statsInView ? c4 : '0'}/7</span><span className="hiw-stat-label">AI Mentor Support</span></div>
                </div>
            </section>

            {/* ── JOURNEY OVERVIEW (pill timeline) ── */}
            <section className="hiw-overview" id="journey">
                <div className="hiw-section-header">
                    <span className="hiw-tag">THE JOURNEY</span>
                    <h2 className="hiw-section-title">10 Steps from Beginner to Career-Ready</h2>
                    <p className="hiw-section-sub">Every step is connected — your data flows seamlessly from assessment to roadmap to mentor to analytics.</p>
                </div>
                <div className="hiw-timeline">
                    {steps.map((s, i) => (
                        <div key={i} className="hiw-timeline-pill">
                            <div className={`hiw-pill-icon hiw-color-${s.color}`}>{s.icon}</div>
                            <span className="hiw-pill-label">{s.title}</span>
                            {i < steps.length - 1 && <div className="hiw-pill-connector" />}
                        </div>
                    ))}
                </div>
            </section>

            {/* ── STEP CARDS ── */}
            <section className="hiw-steps">
                <div className="hiw-steps-inner">
                    {steps.map((s, i) => (
                        <div key={i} className={`hiw-step-card ${i % 2 === 1 ? 'hiw-step-reverse' : ''}`}>
                            <div className="hiw-step-visual">
                                <div className={`hiw-step-graphic hiw-color-${s.color}`}>
                                    <div className="hiw-step-num-bg">{s.num}</div>
                                    <div className={`hiw-step-icon-wrap hiw-color-${s.color}`}>{s.icon}</div>
                                </div>
                            </div>
                            <div className="hiw-step-content">
                                <div className="hiw-step-meta">
                                    <span className={`hiw-step-badge hiw-color-${s.color}`}>Step {s.num}</span>
                                    <span className="hiw-step-subtitle">{s.subtitle}</span>
                                </div>
                                <h3 className="hiw-step-title">{s.title}</h3>
                                <p className="hiw-step-desc">{s.desc}</p>
                                <ul className="hiw-step-bullets">
                                    {s.bullets.map((b, j) => (
                                        <li key={j}><FiCheck className="hiw-check" /> {b}</li>
                                    ))}
                                </ul>
                                <Link to={s.link} className={`hiw-step-link hiw-color-${s.color}`}>
                                    {s.linkLabel} <FiArrowRight />
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── AI SECTION ── */}
            <section className="hiw-ai-section">
                <div className="hiw-ai-inner">
                    <div className="hiw-ai-content">
                        <span className="hiw-tag">POWERED BY AI</span>
                        <h2 className="hiw-section-title">The Intelligence Behind EduPath</h2>
                        <p className="hiw-ai-desc">
                            EduPath uses GPT-4 at three key stages — roadmap generation, quiz creation, and
                            AI mentoring — each enriched with your real-time skill data and personal goals.
                        </p>
                        <div className="hiw-ai-pillars">
                            {[
                                { label: 'Roadmap Builder', icon: '🗺️', desc: 'GPT-4 generates a full structured curriculum from your goals + skill scores in seconds.' },
                                { label: 'Quiz Engine', icon: '📝', desc: 'Questions are generated per topic and difficulty adapts based on your past performance.' },
                                { label: 'AI Mentor', icon: '🤖', desc: 'Context-aware chat that knows your entire roadmap and skill profile for precise answers.' },
                                { label: 'Career Readiness', icon: '📊', desc: 'A live CRI score computed from all your quiz results and learning activity.' },
                            ].map((p, i) => (
                                <div key={i} className="hiw-ai-pillar">
                                    <div className="hiw-ai-pillar-icon">{p.icon}</div>
                                    <div>
                                        <div className="hiw-ai-pillar-label">{p.label}</div>
                                        <div className="hiw-ai-pillar-desc">{p.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="hiw-ai-visual">
                        <div className="hiw-ai-orbit">
                            <div className="hiw-orbit-center">🧠 AI</div>
                            {['Assessment', 'Goals', 'Roadmap', 'Mentor', 'Quizzes', 'Analytics'].map((l, i) => (
                                <div key={i} className="hiw-orbit-node" style={{ '--i': i, '--total': 6 }}>
                                    <span>{l}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── DATA FLOW ── */}
            <section className="hiw-flow-section">
                <div className="hiw-section-header">
                    <span className="hiw-tag">DATA FLOW</span>
                    <h2 className="hiw-section-title">Everything is Connected</h2>
                    <p className="hiw-section-sub">Your data moves intelligently across the platform — each action making the next recommendation smarter.</p>
                </div>
                <div className="hiw-flow-grid">
                    {[
                        { from: '📋 Profile', arrow: '→', to: '🧪 Assessment', desc: 'Profile data pre-filters questions by stream & year' },
                        { from: '🧪 Assessment', arrow: '→', to: '🗺️ Roadmap AI', desc: 'Skill scores drive topic difficulty & sequence' },
                        { from: '🎯 Goals', arrow: '→', to: '🗺️ Roadmap AI', desc: 'Career goals shape the content & focus areas' },
                        { from: '📚 Topics', arrow: '→', to: '📝 Quizzes', desc: 'Each topic auto-generates its own quiz set' },
                        { from: '📝 Quizzes', arrow: '→', to: '📊 Analytics', desc: 'Quiz scores feed the Career Readiness Index' },
                        { from: '📊 Analytics', arrow: '→', to: '🤖 Mentor', desc: 'Mentor has live access to your skill radar' },
                    ].map((f, i) => (
                        <div key={i} className="hiw-flow-card">
                            <div className="hiw-flow-nodes">
                                <span className="hiw-flow-node">{f.from}</span>
                                <span className="hiw-flow-arrow">{f.arrow}</span>
                                <span className="hiw-flow-node">{f.to}</span>
                            </div>
                            <p className="hiw-flow-desc">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── FAQ ── */}
            <section className="hiw-faq-section">
                <div className="hiw-section-header">
                    <span className="hiw-tag">FAQ</span>
                    <h2 className="hiw-section-title">Common Questions</h2>
                </div>
                <div className="hiw-faq-list">
                    {faqs.map((f, i) => <FAQItem key={i} q={f.q} a={f.a} />)}
                </div>
            </section>

            {/* ── CTA ── */}
            <section className="hiw-cta">
                <div className="hiw-cta-inner">
                    <h2 className="hiw-cta-title">Ready to Start Your Journey?</h2>
                    <p className="hiw-cta-sub">Join thousands of learners who've already taken the first step with EduPath.</p>
                    <div className="hiw-cta-btns">
                        <Link to="/signup" className="hiw-btn hiw-btn-primary hiw-btn-large">Start Learning Free <FiArrowRight /></Link>
                        <Link to="/login" className="hiw-btn hiw-btn-ghost hiw-btn-large">Sign In</Link>
                    </div>
                </div>
            </section>

        </div>
    );
};

export default HowItWorks;
