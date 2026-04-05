import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateCustomRoadmap, uploadSyllabus } from '../services/api';
import { FiUploadCloud, FiMessageSquare, FiTarget, FiAlignLeft, FiCalendar } from 'react-icons/fi';
import './CreatePlan.css';

const CreatePlan = () => {
    const navigate = useNavigate();
    const [currentGoal, setCurrentGoal] = useState('');
    const [description, setDescription] = useState('');
    const [duration, setDuration] = useState('');
    const [durationUnit, setDurationUnit] = useState('Days');
    const [inputType, setInputType] = useState('custom'); // 'custom' or 'file'
    const [file, setFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            if (inputType === 'file' && file) {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('goal', currentGoal.trim() || file.name.split('.')[0] || 'My Syllabus');
                
                const uploadRes = await uploadSyllabus(formData);
                await import('../services/api').then(m => m.generateRoadmap({ course_id: uploadRes.data.course_id }));
                
                navigate(`/roadmap/${uploadRes.data.course_id}`);
            } else {
                if (!currentGoal.trim() || !description.trim() || !duration) {
                    setError('Please fill out all fields.');
                    setIsLoading(false);
                    return;
                }

                const numDays = parseInt(duration, 10) || 7;
                let calculatedTopics = numDays;
                if (durationUnit === 'Weeks') calculatedTopics = numDays * 7;
                else if (durationUnit === 'Months') calculatedTopics = numDays * 30;

                calculatedTopics = Math.max(1, Math.min(calculatedTopics, 90));

                const payload = {
                    subject: currentGoal.trim(),
                    description: description.trim(),
                    duration: `${duration} ${durationUnit}`,
                    num_topics: calculatedTopics
                };

                const res = await generateCustomRoadmap(payload);
                if (res.data.status === 'success') {
                    navigate(`/roadmap/${res.data.course_id}`);
                } else {
                    navigate('/dashboard');
                }
            }
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to generate study plan. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const getTopicPreview = () => {
        if (!duration) return null;
        const n = parseInt(duration, 10) || 0;
        if (n <= 0) return null;
        let days = n;
        if (durationUnit === 'Weeks') days = n * 7;
        else if (durationUnit === 'Months') days = n * 30;
        days = Math.min(days, 90);
        return days;
    };
    const topicPreview = getTopicPreview();

    return (
        <div className="plan-container animate-fade-in">
            <div className="plan-header">
                <h1>Build Your Roadmap</h1>
                <p>Define your goal and timeframe, and we'll create a personalized step-by-step plan using AI.</p>
            </div>

            <form onSubmit={handleSubmit} className="plan-form card">
                {error && <div className="error-toast">{error}</div>}

                <div className="input-toggle-group">
                    <button
                        type="button"
                        className={`toggle-btn ${inputType === 'custom' ? 'active' : ''}`}
                        onClick={() => setInputType('custom')}
                    >
                        <FiMessageSquare size={18} /> Generate from Subject
                    </button>
                    <button
                        type="button"
                        className={`toggle-btn ${inputType === 'file' ? 'active' : ''}`}
                        onClick={() => setInputType('file')}
                    >
                        <FiUploadCloud size={18} /> Upload Syllabus (PDF)
                    </button>
                </div>

                {inputType === 'custom' ? (
                    <div className="text-input-area animate-fade-in custom-goal-form">

                        <div className="form-group">
                            <label className="plan-label">
                                <FiTarget size={16} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} />
                                Current goal ?
                            </label>
                            <input
                                type="text"
                                className="cyber-input"
                                placeholder="e.g. Master React.js, Get a Data Science Job..."
                                value={currentGoal}
                                onChange={(e) => setCurrentGoal(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="plan-label">
                                <FiAlignLeft size={16} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} />
                                Describe your Goal
                            </label>
                            <textarea
                                className="cyber-input"
                                placeholder="Describe in detail what you want to achieve, your current level, and what you want to focus on..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
                                rows="4"
                                style={{ resize: 'vertical' }}
                            />
                        </div>

                        <div className="form-group">
                            <label className="plan-label">
                                <FiCalendar size={16} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} />
                                Study Duration
                            </label>
                            <div className="duration-inputs">
                                <input
                                    type="number"
                                    min="1"
                                    className="cyber-input"
                                    placeholder="e.g. 30"
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value)}
                                    required
                                    style={{ flex: 2 }}
                                />
                                <select
                                    className="cyber-input select-unit"
                                    value={durationUnit}
                                    onChange={(e) => setDurationUnit(e.target.value)}
                                    style={{ flex: 1 }}
                                >
                                    <option value="Days">Days</option>
                                    <option value="Weeks">Weeks</option>
                                    <option value="Months">Months</option>
                                </select>
                            </div>
                            {topicPreview && (
                                <div className="topic-preview-badge">
                                    <span className="emoji">🗺️</span> <strong>{topicPreview} map points</strong> will be created
                                </div>
                            )}
                        </div>

                    </div>
                ) : (
                    <div className="file-input-area animate-fade-in">
                        <label className="plan-label">Upload your course syllabus (PDF)</label>
                        <div className="file-upload-box">
                            <input
                                type="file"
                                id="syllabus-upload"
                                accept=".pdf"
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                            />
                            <label htmlFor="syllabus-upload" className="upload-label-btn">
                                <FiUploadCloud size={40} color={file ? "var(--primary)" : "var(--text-secondary)"} />
                                <span className="upload-text">{file ? file.name : "Click to browse files"}</span>
                                <small>{file ? "File selected" : "PDF documents only"}</small>
                            </label>
                        </div>
                    </div>
                )}

                <div className="plan-actions" style={{ marginTop: '2rem' }}>
                    <button
                        type="submit"
                        className="btn btn-full"
                        disabled={isLoading || (inputType === 'file' && !file)}
                    >
                        {isLoading
                            ? 'AI is building your roadmap...'
                            : inputType === 'custom'
                                ? topicPreview
                                    ? `Generate Roadmap — ${topicPreview} Map Points`
                                    : 'Generate Roadmap'
                                : 'Upload & Build Plan'
                        }
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreatePlan;
