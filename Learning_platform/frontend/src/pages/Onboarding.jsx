import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitOnboarding } from '../services/api';
import './Onboarding.css';

const Onboarding = () => {
    const [step, setStep] = useState(1);
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        degree: '',
        stream: '',
        specialization: '',
        year: 1,
        short_term_goal: '',
        long_term_goal: '',
        preferred_mode: 'Hybrid',
        confidence_level: 'Medium'
    });

    const handleNext = () => setStep((prev) => prev + 1);
    const handlePrev = () => setStep((prev) => prev - 1);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setError('');
        try {
            await submitOnboarding({ ...formData, year: String(formData.year) });
            // Mandatory: go to initial assessment exam
            navigate('/assessment');
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to save profile. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const totalSteps = 2;

    return (
        <div className="onboarding-container animate-fade-in">
            <div className="card onboarding-card">
                <h2>Welcome to Edupath!</h2>
                <p className="subtitle">Let's set up your profile to personalize your learning journey.</p>

                <div className="progress-indicator">
                    <div className={`step ${step >= 1 ? 'active' : ''}`}>1. Academic</div>
                    <div className={`step ${step >= 2 ? 'active' : ''}`}>2. Career</div>
                    <div className="step upcoming">3. Assessment →</div>
                </div>

                {error && <div className="error-message">{error}</div>}

                {step === 1 && (
                    <div className="step-content">
                        <h3>Academic Profile</h3>
                        <div className="form-group">
                            <label>Degree (e.g., B.Tech, B.Sc)</label>
                            <input
                                className="cyber-input"
                                type="text"
                                value={formData.degree}
                                placeholder="e.g. B.Tech"
                                onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Stream</label>
                            <input
                                className="cyber-input"
                                type="text"
                                value={formData.stream}
                                placeholder="e.g. Computer Science"
                                onChange={(e) => setFormData({ ...formData, stream: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Specialization (Optional)</label>
                            <input
                                className="cyber-input"
                                type="text"
                                value={formData.specialization}
                                placeholder="e.g. AI & Machine Learning"
                                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Year of Study</label>
                            <select
                                className="cyber-input"
                                value={formData.year}
                                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                            >
                                <option value={1}>1st Year</option>
                                <option value={2}>2nd Year</option>
                                <option value={3}>3rd Year</option>
                                <option value={4}>4th Year</option>
                            </select>
                        </div>
                        <button className="btn" onClick={handleNext} disabled={!formData.degree || !formData.stream}>
                            Next →
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className="step-content">
                        <h3>Career Goals</h3>
                        <div className="form-group">
                            <label>Short-term Goal</label>
                            <input
                                className="cyber-input"
                                type="text"
                                value={formData.short_term_goal}
                                placeholder="e.g. Get an internship"
                                onChange={(e) => setFormData({ ...formData, short_term_goal: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Long-term Goal</label>
                            <input
                                className="cyber-input"
                                type="text"
                                value={formData.long_term_goal}
                                placeholder="e.g. Become a Software Engineer"
                                onChange={(e) => setFormData({ ...formData, long_term_goal: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Preferred Learning Mode</label>
                            <select
                                className="cyber-input"
                                value={formData.preferred_mode}
                                onChange={(e) => setFormData({ ...formData, preferred_mode: e.target.value })}
                            >
                                <option value="Syllabus">Syllabus-driven</option>
                                <option value="Skill">Skill-driven</option>
                                <option value="Hybrid">Hybrid</option>
                            </select>
                        </div>
                        <div className="button-group">
                            <button className="btn btn-secondary" onClick={handlePrev}>← Back</button>
                            <button
                                className="btn"
                                onClick={handleSubmit}
                                disabled={!formData.short_term_goal || !formData.long_term_goal || isSubmitting}
                            >
                                {isSubmitting ? 'Saving...' : 'Save & Take Assessment →'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Onboarding;
