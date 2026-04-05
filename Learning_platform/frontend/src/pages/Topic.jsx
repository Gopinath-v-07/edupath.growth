import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTopic, getTopicMaterials } from '../services/api';
import api from '../services/api';
import './Topic.css';

const StarRating = ({ value, onChange }) => (
    <div className="star-row">
        {[1, 2, 3, 4, 5].map(n => (
            <button
                key={n}
                className={`star-btn ${n <= value ? 'active' : ''}`}
                onClick={() => onChange(n)}
                title={`${n} star${n > 1 ? 's' : ''}`}
            >★</button>
        ))}
    </div>
);

const Topic = () => {
    const { topicId } = useParams();
    const navigate = useNavigate();
    const [topic, setTopic] = useState(null);
    const [loading, setLoading] = useState(true);

    // Materials state
    const [showMaterials, setShowMaterials] = useState(false);
    const [materials, setMaterials] = useState(null);
    const [materialsLoading, setMaterialsLoading] = useState(false);
    const [userQuery, setUserQuery] = useState('');
    const [queryInput, setQueryInput] = useState('');
    const [activeTab, setActiveTab] = useState('concepts');

    // Feedback state
    const [feedback, setFeedback] = useState({ rating: 0, helpful: null, comment: '' });
    const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
    const [feedbackLoading, setFeedbackLoading] = useState(false);

    useEffect(() => {
        const fetchTopic = async () => {
            try {
                const { data } = await getTopic(topicId);
                setTopic(data);
            } catch (error) {
                console.error("Error fetching topic", error);
                if (error.response?.status === 403) {
                    alert("This topic is locked. Complete previous topics first.");
                    navigate(-1);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchTopic();
    }, [topicId, navigate]);

    const fetchMaterials = async (query = '') => {
        setMaterialsLoading(true);
        setMaterials(null);
        try {
            const { data } = await getTopicMaterials(topicId, query);
            setMaterials(data.materials);
            setActiveTab('concepts');
        } catch (err) {
            console.error("Error fetching materials", err);
        } finally {
            setMaterialsLoading(false);
        }
    };

    const handleOpenMaterials = () => {
        setShowMaterials(true);
        if (!materials) fetchMaterials();
    };

    const handleQuerySubmit = (e) => {
        e.preventDefault();
        if (!queryInput.trim()) return;
        setUserQuery(queryInput.trim());
        fetchMaterials(queryInput.trim());
    };

    const handleFeedbackSubmit = async () => {
        if (feedback.rating === 0 && feedback.helpful === null) return;
        setFeedbackLoading(true);
        try {
            await api.post(`/roadmap/topic/${topicId}/feedback`, {
                rating: feedback.rating,
                helpful: feedback.helpful,
                comment: feedback.comment,
            });
            setFeedbackSubmitted(true);
        } catch (err) {
            // Even if API fails, show success so UX is smooth
            setFeedbackSubmitted(true);
        } finally {
            setFeedbackLoading(false);
        }
    };

    if (loading) return <div className="topic-wrapper topic-loading">Loading topic...</div>;
    if (!topic) return <div className="topic-wrapper">Topic not found.</div>;

    let notesContent = "";
    let youtubeQuery = "";
    try {
        const parsed = JSON.parse(topic.content || "{}");
        notesContent = parsed.notes || topic.content;
        youtubeQuery = parsed.youtube_query || `${topic.title} tutorial`;
    } catch (e) {
        notesContent = topic.content;
        youtubeQuery = `${topic.title} tutorial`;
    }

    const paragraphs = typeof notesContent === 'string'
        ? notesContent.split('\n').filter(p => p.trim() !== '')
        : [];

    const tabs = [
        { id: 'concepts', label: '🔑 Key Concepts' },
        { id: 'explanation', label: '📖 Explanation' },
        { id: 'examples', label: '💡 Examples' },
        { id: 'summary', label: '📝 Summary' },
    ];
    if (materials?.extra_content) {
        tabs.push({ id: 'extra', label: '🎯 Your Query' });
    }

    return (
        <div className="topic-wrapper">
            {/* ── Back Nav ── */}
            <div className="topic-nav-header">
                <button className="topic-back-btn" onClick={() => navigate('/roadmap')}>
                    ← Back to Roadmap
                </button>
                {topic.is_completed && (
                    <span className="completed-badge">✓ Completed</span>
                )}
            </div>

            {/* ── Topic Card ── */}
            <div className="topic-card animate-fade-in">
                <div className="topic-card-header">
                    <h1 className="topic-title gradient-text">{topic.title}</h1>
                    <p className="topic-subtitle">
                        Core concepts and definitions for <strong>{topic.title}</strong>. This day focuses on building structured knowledge and practical skills in this area.
                    </p>
                </div>

                {/* ── Action Buttons ── */}
                <div className="topic-actions">
                    <button className="btn-material" onClick={handleOpenMaterials}>
                        📂 Materials
                    </button>
                    <a
                        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(youtubeQuery)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-youtube"
                    >
                        <span>▶</span> YouTube Tutorials
                    </a>
                    <button className="btn-quiz" onClick={() => navigate(`/quiz/${topic.id}`)}>
                        {topic.is_completed ? 'Retake Quiz' : 'Take Quiz to Pass'}
                    </button>
                    {topic.is_completed && (
                        <button
                            className="btn-continue"
                            onClick={() => navigate('/roadmap')}
                        >
                            Continue Map 🗺️
                        </button>
                    )}
                </div>

                {/* ── Topic Notes ── */}
                {paragraphs.length > 0 && (
                    <div className="topic-notes">
                        {paragraphs.map((p, idx) => (
                            <p key={idx}>{p}</p>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Materials Panel ── */}
            {showMaterials && (
                <div className="materials-panel animate-fade-in">
                    <div className="materials-header">
                        <div className="materials-header-left">
                            <span className="materials-icon">📂</span>
                            <h2>Study Materials — <span>{topic.title}</span></h2>
                        </div>
                        <button className="close-btn" onClick={() => setShowMaterials(false)}>✕</button>
                    </div>

                    {/* Query Bar */}
                    <form className="query-bar" onSubmit={handleQuerySubmit}>
                        <input
                            type="text"
                            placeholder="Ask anything about this topic — e.g. 'Explain with a coding example'"
                            value={queryInput}
                            onChange={e => setQueryInput(e.target.value)}
                            className="query-input"
                        />
                        <button type="submit" className="query-btn">
                            ✨ Get Content
                        </button>
                    </form>
                    {userQuery && (
                        <p className="query-label">📌 Showing results for: <em>"{userQuery}"</em></p>
                    )}

                    {materialsLoading && (
                        <div className="materials-loading">
                            <div className="spinner" />
                            <p>Generating study materials with AI...</p>
                        </div>
                    )}

                    {materials && !materialsLoading && (
                        <>
                            {/* Tabs */}
                            <div className="materials-tabs">
                                {tabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                                        onClick={() => setActiveTab(tab.id)}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Tab Content */}
                            <div className="tab-content">
                                {activeTab === 'concepts' && (
                                    <div className="concepts-section">
                                        <h3>Key Concepts to Master</h3>
                                        <ul className="concept-list">
                                            {(materials.key_concepts || []).map((concept, i) => (
                                                <li key={i} className="concept-item">
                                                    <span className="concept-num">{i + 1}</span>
                                                    <span className="concept-text">{concept}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {activeTab === 'explanation' && (
                                    <div className="explanation-section">
                                        <h3>Deep Explanation</h3>
                                        {(materials.explanation || '').split('\n').filter(p => p.trim()).map((para, i) => (
                                            <p key={i} className="explanation-para">{para}</p>
                                        ))}
                                    </div>
                                )}

                                {activeTab === 'examples' && (
                                    <div className="examples-section">
                                        <h3>Real-World Examples</h3>
                                        <div className="examples-grid">
                                            {(materials.examples || []).map((ex, i) => (
                                                <div key={i} className="example-card">
                                                    <div className="example-num">Example {i + 1}</div>
                                                    <h4>{ex.title}</h4>
                                                    <p>{ex.description}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'summary' && (
                                    <div className="summary-section">
                                        <h3>Quick Summary</h3>
                                        <div className="summary-box">
                                            <p>{materials.summary}</p>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'extra' && materials.extra_content && (
                                    <div className="extra-section">
                                        <h3>🎯 Your Query: "{userQuery}"</h3>
                                        {(materials.extra_content || '').split('\n').filter(p => p.trim()).map((para, i) => (
                                            <p key={i} className="explanation-para">{para}</p>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ── Module Feedback ── */}
            <div className="feedback-section animate-fade-in">
                <div className="feedback-header">
                    <span className="feedback-icon">💬</span>
                    <div>
                        <h3>Module Feedback</h3>
                        <p>Help us improve — rate this module</p>
                    </div>
                </div>

                {feedbackSubmitted ? (
                    <div className="feedback-thanks">
                        <span>🎉</span>
                        <div>
                            <strong>Thank you for your feedback!</strong>
                            <p>Your input helps us improve the learning experience.</p>
                        </div>
                    </div>
                ) : (
                    <div className="feedback-body">
                        {/* Star Rating */}
                        <div className="feedback-row">
                            <label className="feedback-label">How would you rate this module?</label>
                            <StarRating
                                value={feedback.rating}
                                onChange={v => setFeedback(f => ({ ...f, rating: v }))}
                            />
                        </div>

                        {/* Helpful */}
                        <div className="feedback-row">
                            <label className="feedback-label">Was this content helpful?</label>
                            <div className="helpful-btns">
                                <button
                                    className={`helpful-btn ${feedback.helpful === true ? 'yes-active' : ''}`}
                                    onClick={() => setFeedback(f => ({ ...f, helpful: true }))}
                                >
                                    👍 Yes
                                </button>
                                <button
                                    className={`helpful-btn ${feedback.helpful === false ? 'no-active' : ''}`}
                                    onClick={() => setFeedback(f => ({ ...f, helpful: false }))}
                                >
                                    👎 No
                                </button>
                            </div>
                        </div>

                        {/* Comment */}
                        <div className="feedback-row">
                            <label className="feedback-label">Any additional comments? (optional)</label>
                            <textarea
                                className="feedback-textarea"
                                placeholder="What could be improved? What did you find most useful?"
                                value={feedback.comment}
                                onChange={e => setFeedback(f => ({ ...f, comment: e.target.value }))}
                                rows={3}
                            />
                        </div>

                        <button
                            className="feedback-submit-btn"
                            onClick={handleFeedbackSubmit}
                            disabled={feedbackLoading || (feedback.rating === 0 && feedback.helpful === null)}
                        >
                            {feedbackLoading ? 'Submitting...' : 'Submit Feedback'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Topic;
