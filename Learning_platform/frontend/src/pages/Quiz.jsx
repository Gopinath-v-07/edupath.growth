import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getQuiz, regenQuiz, submitQuiz } from '../services/api';
import './Quiz.css';

const Quiz = () => {
    const { topicId } = useParams();
    const navigate = useNavigate();
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);
    const [topicTitle, setTopicTitle] = useState('');

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const { data } = await getQuiz(topicId);
                setQuestions(data.questions || []);
                setTopicTitle(data.topic_title || '');
            } catch (error) {
                console.error("Error fetching quiz", error);
                if (error.response?.status === 404) {
                    alert("Quiz locked. Please pass previous topics.");
                    navigate(-1);
                }
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [topicId, navigate]);

    const handleRegenerate = async () => {
        if (!window.confirm('Regenerate quiz questions with AI? This will create fresh questions for this topic.')) return;
        setLoading(true);
        setAnswers({});
        setResult(null);
        try {
            const { data } = await regenQuiz(topicId);
            setQuestions(data.questions || []);
            setTopicTitle(data.topic_title || '');
        } catch (err) {
            console.error(err);
            alert('Could not regenerate questions right now.');
        } finally {
            setLoading(false);
        }
    };

    const handleOptionSelect = (qId, optIdx) => {
        setAnswers(prev => ({ ...prev, [qId]: optIdx }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (Object.keys(answers).length < questions.length) {
            if (!window.confirm(`You've answered ${Object.keys(answers).length}/${questions.length} questions. Submit anyway?`)) return;
        }
        setSubmitting(true);
        try {
            const { data } = await submitQuiz(topicId, { answers });
            setResult(data);
        } catch (error) {
            console.error(error);
            alert("Error submitting quiz. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const answeredCount = Object.keys(answers).length;
    const progressPct = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

    /* ── LOADING ── */
    if (loading) {
        return (
            <div className="quiz-page-wrapper">
                <div className="quiz-loading">
                    <div className="quiz-spinner" />
                    <p>Preparing your quiz with AI...</p>
                </div>
            </div>
        );
    }

    /* ── RESULT ── */
    if (result) {
        const pct = Math.round((result.score / result.total) * 100);
        return (
            <div className="quiz-result-wrapper animate-fade-in">
                <div className="quiz-result-card">
                    <div className="result-emoji">{result.passed ? '🏆' : '📚'}</div>
                    <div className={`result-score-display ${result.passed ? 'passed' : 'failed'}`}>
                        {pct}%
                    </div>
                    <div className="result-fraction">
                        {result.score} / {result.total} correct
                    </div>

                    <div className={`result-banner ${result.passed ? 'success-banner' : 'error-banner'}`}>
                        {result.passed ? (
                            <>
                                <h3>🎉 Congratulations!</h3>
                                <p>You passed! The next topic has been unlocked. Keep up the great work.</p>
                            </>
                        ) : (
                            <>
                                <h3>Keep Studying 📚</h3>
                                <p>
                                    You scored below 50% on attempt #{result.attempt_number || 1}.
                                    Review the topic materials — <strong>your next attempt will have fresh new questions!</strong>
                                </p>
                            </>
                        )}
                    </div>

                    <div className="result-actions">
                        {!result.passed && (
                            <button
                                className="result-btn secondary"
                                onClick={async () => {
                                    setResult(null);
                                    setAnswers({});
                                    setLoading(true);
                                    try {
                                        // Server already deleted the old quiz on fail — fetch new questions
                                        const { data } = await getQuiz(topicId);
                                        setQuestions(data.questions || []);
                                        setTopicTitle(data.topic_title || '');
                                    } catch (err) {
                                        console.error(err);
                                    } finally {
                                        setLoading(false);
                                    }
                                }}
                            >
                                ↺ Retry with New Questions
                            </button>
                        )}
                        <button className="result-btn primary" onClick={() => navigate('/roadmap')}>
                            Back to Roadmap
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    /* ── QUIZ ── */
    return (
        <div className="quiz-page-wrapper">
            <div className="quiz-inner animate-fade-in">

                {/* Top bar */}
                <div className="quiz-top-bar">
                    <button className="quiz-back-btn" onClick={() => navigate(-1)}>
                        ← Back to Topic
                    </button>
                    <button className="quiz-regen-btn" onClick={handleRegenerate} title="Generate new AI questions">
                        🔄 New Questions
                    </button>
                </div>

                {/* Header card */}
                <div className="quiz-header-card">
                    <div className="quiz-header-text">
                        <h1>Knowledge Check</h1>
                        <p>{topicTitle || 'Answer all questions to complete this topic'}</p>
                    </div>
                    <div className="quiz-header-stats">
                        <div className="quiz-answered-pill">
                            {answeredCount} / {questions.length} answered
                        </div>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="quiz-progress-bar-wrap">
                    <div className="quiz-progress-track">
                        <div className="quiz-progress-fill" style={{ width: `${progressPct}%` }} />
                    </div>
                    <div className="quiz-progress-label">{Math.round(progressPct)}%</div>
                </div>

                {/* Questions */}
                <form onSubmit={handleSubmit} className="quiz-form">
                    {questions.map((q, idx) => {
                        const isAnswered = answers[q.id] !== undefined;
                        return (
                            <div key={q.id} className={`quiz-question-card ${isAnswered ? 'answered' : ''}`}>
                                <div className="question-meta">
                                    <div className={`question-num-badge ${isAnswered ? 'answered-badge' : ''}`}>
                                        {isAnswered ? '✓' : idx + 1}
                                    </div>
                                    <p className="question-text">{q.question}</p>
                                </div>
                                <div className="options-list">
                                    {q.options.map((opt, optIdx) => (
                                        <label
                                            key={optIdx}
                                            className={`option-label ${answers[q.id] === optIdx ? 'selected' : ''}`}
                                        >
                                            <input
                                                type="radio"
                                                name={`question-${q.id}`}
                                                value={optIdx}
                                                checked={answers[q.id] === optIdx}
                                                onChange={() => handleOptionSelect(q.id, optIdx)}
                                                className="hidden-radio"
                                            />
                                            <div className="option-marker">
                                                {String.fromCharCode(65 + optIdx)}
                                            </div>
                                            <div className="option-text">{opt}</div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        );
                    })}

                    {/* Submit */}
                    <div className="quiz-submit-wrapper">
                        <div className="quiz-submit-info">
                            <strong>{answeredCount}</strong> of <strong>{questions.length}</strong> questions answered
                        </div>
                        <button type="submit" className="quiz-submit-btn" disabled={submitting}>
                            {submitting ? '⏳ Evaluating...' : 'Submit Answers →'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Quiz;
