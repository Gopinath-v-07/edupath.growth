import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { updateGoals } from '../services/api';
import './Goals.css';

const Goals = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const fromDashboard = queryParams.get('from') === 'dashboard';

    const [shortTerm, setShortTerm] = useState('');
    const [longTerm, setLongTerm] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const presetShortTerm = [
        "Pass next semester exams",
        "Get a summer internship",
        "Build 3 portfolio projects",
        "Learn Python basics"
    ];

    const presetLongTerm = [
        "Software Engineer at a Tech Giant",
        "Data Scientist",
        "Cybersecurity Analyst",
        "Product Manager"
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await updateGoals({
                short_term_goal: shortTerm,
                long_term_goal: longTerm
            });
            if (fromDashboard) {
                navigate('/dashboard');
            } else {
                navigate('/create-plan');
            }
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to save goals.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="goals-container animate-fade-in">
            <div className="goals-header">
                <h1>What is your Goal?</h1>
                <p>Define your destination so we can map out the best route for you.</p>
            </div>

            <form onSubmit={handleSubmit} className="goals-form card">
                {error && <div className="error-toast">{error}</div>}

                <div className="goal-section">
                    <label className="goal-label">Short Term Goal</label>
                    <p className="goal-subtext">What do you want to achieve in the next 3-6 months?</p>
                    <div className="preset-tags">
                        {presetShortTerm.map((tag, idx) => (
                            <span
                                key={idx}
                                className={`preset-tag ${shortTerm === tag ? 'active' : ''}`}
                                onClick={() => setShortTerm(tag)}
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                    <input
                        type="text"
                        className="cyber-input goal-input"
                        placeholder="Type your own short-term goal..."
                        value={shortTerm}
                        onChange={(e) => setShortTerm(e.target.value)}
                        required
                    />
                </div>

                <div className="goal-divider"></div>

                <div className="goal-section">
                    <label className="goal-label">Long Term Goal</label>
                    <p className="goal-subtext">Where do you see yourself in 2-5 years?</p>
                    <div className="preset-tags">
                        {presetLongTerm.map((tag, idx) => (
                            <span
                                key={idx}
                                className={`preset-tag ${longTerm === tag ? 'active' : ''}`}
                                onClick={() => setLongTerm(tag)}
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                    <input
                        type="text"
                        className="cyber-input goal-input"
                        placeholder="Type your own long-term goal..."
                        value={longTerm}
                        onChange={(e) => setLongTerm(e.target.value)}
                        required
                    />
                </div>

                <div className="goals-actions">
                    <button type="submit" className="btn btn-full" disabled={isLoading || !shortTerm || !longTerm}>
                        {isLoading ? 'Saving...' : 'Next Step: Let\'s Make Your Plan'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Goals;
