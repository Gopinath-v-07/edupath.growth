import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAssessmentQuestions, submitAssessment, hasCompletedAssessment } from '../services/api';
import './Assessment.css';

const CATEGORY_META = {
    'Universal Skills':  { icon: '🧠', color: '#6366f1', label: 'Universal Skills' },
    'Stream-Specific':   { icon: '💻', color: '#10b981', label: 'Technical Skills' },
    'Goal-Based':        { icon: '🎯', color: '#f59e0b', label: 'Goal-Based Skills' },
};

const CLASSIFICATION_META = {
    Advanced:     { color: '#10b981', bg: 'rgba(16,185,129,0.12)', emoji: '🏆' },
    Intermediate: { color: '#6366f1', bg: 'rgba(99,102,241,0.12)', emoji: '📈' },
    Basic:        { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', emoji: '📚' },
    Foundation:   { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  emoji: '🌱' },
};

const Assessment = () => {
    const [questions, setQuestions]         = useState([]);
    const [answers, setAnswers]             = useState({});
    const [currentIdx, setCurrentIdx]       = useState(0);
    const [loading, setLoading]             = useState(true);
    const [submitting, setSubmitting]       = useState(false);
    const [error, setError]                 = useState('');
    const [skillResults, setSkillResults]   = useState(null); // null = exam mode, object = results mode
    const [selected, setSelected]           = useState(null);  // highlight selected before advancing
    const [alreadyCompleted, setAlreadyCompleted] = useState(false); // user already finished initial assessment
    const navigate = useNavigate();

    useEffect(() => {
        const init = async () => {
            try {
                const completedRes = await hasCompletedAssessment();
                if (completedRes.data.completed) {
                    // Show "no more exams" screen instead of silently redirecting
                    setAlreadyCompleted(true);
                    setLoading(false);
                    return;
                }
                const res = await fetchAssessmentQuestions();
                setQuestions(res.data.questions);
            } catch (err) {
                setError('Failed to load assessment questions.');
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    const currentQ = questions[currentIdx];
    const totalQ   = questions.length;
    const progress  = totalQ > 0 ? ((currentIdx) / totalQ) * 100 : 0;

    const handleSelect = (optionIndex) => {
        if (selected !== null) return; // already picked, wait for Next
        setSelected(optionIndex);
        setAnswers(prev => ({ ...prev, [currentQ.id]: optionIndex }));
    };

    const handleNext = () => {
        setSelected(null);
        if (currentIdx < totalQ - 1) {
            setCurrentIdx(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        setSelected(null);
        setCurrentIdx(prev => prev - 1);
        // Restore previous selection
        const prevQ = questions[currentIdx - 1];
        setSelected(answers[prevQ?.id] ?? null);
    };

    // Restore selection when navigating back/forward
    useEffect(() => {
        if (currentQ) {
            setSelected(answers[currentQ.id] ?? null);
        }
    }, [currentIdx]);

    const handleSubmit = async () => {
        setSubmitting(true);
        setError('');
        try {
            const res = await submitAssessment(answers);
            setSkillResults(res.data.skill_scores);
        } catch (err) {
            setError('Failed to submit assessment. Please try again.');
            setSubmitting(false);
        }
    };

    const handleGoToDashboard = () => navigate('/dashboard');

    // ── Loading ───────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="exam-shell">
                <div className="exam-loading">
                    <div className="exam-spinner" />
                    <p>Loading your assessment…</p>
                </div>
            </div>
        );
    }

    // ── Already Completed Screen ──────────────────────────────────────────────
    if (alreadyCompleted) {
        return (
            <div className="exam-shell">
                <div className="no-exam-wrapper animate-fade-in">
                    <div className="no-exam-icon">✅</div>
                    <h2 className="no-exam-title">Initial Assessment Complete</h2>
                    <p className="no-exam-sub">
                        You've already completed the initial skill assessment.
                        Your personalized learning journey has been set up based on your results.
                    </p>

                    <div className="no-exam-status-card">
                        <div className="no-exam-status-row">
                            <span className="no-exam-status-dot completed" />
                            <span className="no-exam-status-label">Initial Assessment</span>
                            <span className="no-exam-status-badge">Completed</span>
                        </div>
                    </div>

                    <div className="no-exam-empty">
                        <div className="no-exam-empty-icon">📋</div>
                        <p className="no-exam-empty-text">No other exams available right now</p>
                        <p className="no-exam-empty-hint">
                            Future assessments will appear here as you progress through your roadmap.
                        </p>
                    </div>

                    <div className="no-exam-actions">
                        <button className="exam-cta-btn" onClick={() => navigate('/analysis')}>
                            📊 View My Skill Analysis
                        </button>
                        <button className="no-exam-secondary-btn" onClick={() => navigate('/dashboard')}>
                            Go to Dashboard →
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ── Submitting ────────────────────────────────────────────────────────────
    if (submitting) {
        return (
            <div className="exam-shell">
                <div className="exam-loading">
                    <div className="exam-spinner" />
                    <h3>Analyzing your responses…</h3>
                    <p>Building your skill profile</p>
                </div>
            </div>
        );
    }

    // ── Results Screen ────────────────────────────────────────────────────────
    if (skillResults) {
        const entries = Object.entries(skillResults);
        const overallScore = Math.round(
            entries.reduce((sum, [, v]) => sum + v.score, 0) / entries.length
        );
        return (
            <div className="exam-shell">
                <div className="results-wrapper animate-fade-in">
                    <div className="results-hero">
                        <div className="results-trophy">🎉</div>
                        <h2>Assessment Complete!</h2>
                        <p className="results-sub">Here's your baseline skill profile</p>
                        <div className="results-overall">
                            <span className="results-overall-score">{overallScore}%</span>
                            <span className="results-overall-label">Overall Score</span>
                        </div>
                    </div>

                    <div className="results-grid">
                        {entries.map(([skill, data]) => {
                            const meta = CLASSIFICATION_META[data.classification];
                            return (
                                <div className="result-card" key={skill} style={{ '--card-color': meta.color, '--card-bg': meta.bg }}>
                                    <div className="result-card-top">
                                        <span className="result-emoji">{meta.emoji}</span>
                                        <span className="result-skill">{skill.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                                        <span className="result-class" style={{ color: meta.color }}>{data.classification}</span>
                                    </div>
                                    <div className="result-bar-track">
                                        <div
                                            className="result-bar-fill"
                                            style={{ width: `${data.score}%`, background: meta.color }}
                                        />
                                    </div>
                                    <div className="result-stats">
                                        <span>{data.correct}/{data.total} correct</span>
                                        <span>{data.score}%</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <button className="exam-cta-btn" onClick={handleGoToDashboard}>
                        Go to My Dashboard →
                    </button>
                </div>
            </div>
        );
    }

    // ── Exam Screen ───────────────────────────────────────────────────────────
    const catMeta = CATEGORY_META[currentQ?.category] || { icon: '📋', color: '#6366f1', label: currentQ?.category };
    const isLast  = currentIdx === totalQ - 1;
    const answeredCount = Object.keys(answers).length;

    return (
        <div className="exam-shell">
            {/* Header */}
            <div className="exam-header">
                <div className="exam-logo">📘 EduPath Initial Assessment</div>
                <div className="exam-progress-text">{currentIdx + 1} / {totalQ}</div>
            </div>

            {/* Progress Bar */}
            <div className="exam-progress-bar">
                <div className="exam-progress-fill" style={{ width: `${progress}%` }} />
            </div>

            {/* Card */}
            <div className="exam-card animate-slide-up" key={currentIdx}>
                {/* Category Badge */}
                <div className="exam-category-badge" style={{ background: catMeta.color + '1a', color: catMeta.color }}>
                    <span>{catMeta.icon}</span>
                    <span>{catMeta.label}</span>
                </div>

                {/* Question */}
                <div className="exam-question">
                    <span className="exam-q-num">Q{currentIdx + 1}.</span>
                    {currentQ.question}
                </div>

                {/* Options */}
                <div className="exam-options">
                    {currentQ.options.map((opt, i) => (
                        <button
                            key={i}
                            className={`exam-option ${selected === i ? 'selected' : ''}`}
                            onClick={() => handleSelect(i)}
                            style={selected === i ? { '--sel-color': catMeta.color } : {}}
                        >
                            <span className="exam-option-letter">{String.fromCharCode(65 + i)}</span>
                            <span className="exam-option-text">{opt}</span>
                        </button>
                    ))}
                </div>

                {error && <div className="exam-error">{error}</div>}

                {/* Footer nav */}
                <div className="exam-nav">
                    <button
                        className="exam-nav-btn secondary"
                        onClick={handlePrev}
                        disabled={currentIdx === 0}
                    >
                        ← Back
                    </button>

                    <span className="exam-answered-count">{answeredCount} answered</span>

                    {!isLast ? (
                        <button
                            className="exam-nav-btn"
                            onClick={handleNext}
                            disabled={selected === null}
                        >
                            Next →
                        </button>
                    ) : (
                        <button
                            className="exam-nav-btn submit"
                            onClick={handleSubmit}
                            disabled={answeredCount < totalQ || submitting}
                        >
                            {submitting ? 'Submitting…' : '✓ Submit'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Assessment;
