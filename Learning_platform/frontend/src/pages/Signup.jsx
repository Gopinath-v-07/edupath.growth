import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiEye, FiEyeOff, FiArrowLeft } from 'react-icons/fi';
import { signupUser, loginUser } from '../services/api';
import './Auth.css';

const Signup = () => {
    const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords don't match.");
            return;
        }
        setIsLoading(true);
        try {
            await signupUser({ name: formData.name, email: formData.email, password: formData.password });
            const loginResponse = await loginUser({ email: formData.email, password: formData.password });
            localStorage.setItem('token', loginResponse.data.access_token);
            navigate('/onboarding');
        } catch (err) {
            setError(err.response?.data?.detail || 'An error occurred during signup.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page animate-fade-in">

            {/* ── Left Hero Panel ── */}
            <div className="auth-left">
                <div className="auth-brand-icon">
                    <svg viewBox="0 0 24 24">
                        <path d="M12 2L2 7l10 5 10-5-10-5z" />
                        <path d="M2 17l10 5 10-5" />
                        <path d="M2 12l10 5 10-5" />
                    </svg>
                </div>

                <h1 className="auth-left-title">
                    Join <span>EduPath</span>
                </h1>
                <p className="auth-left-subtitle">
                    Create your free account and unlock AI-powered learning
                    paths, smart assessments, and a personal mentor.
                </p>

                <div className="auth-preview">
                    <div className="auth-preview-card main-card">
                        <div className="preview-stat">
                            <div className="preview-stat-dot"></div>
                            <span className="preview-stat-label">React Roadmap</span>
                            <span className="preview-stat-val">72%</span>
                        </div>
                        <div className="preview-stat">
                            <div className="preview-stat-dot green"></div>
                            <span className="preview-stat-label">Quiz Score</span>
                            <span className="preview-stat-val">92</span>
                        </div>
                        <div className="preview-stat">
                            <div className="preview-stat-dot orange"></div>
                            <span className="preview-stat-label">Streak</span>
                            <span className="preview-stat-val">7 days</span>
                        </div>
                        <div className="preview-bar-group">
                            {[['JS', 85], ['CSS', 60], ['Node', 40]].map(([l, v]) => (
                                <div className="preview-bar-row" key={l}>
                                    <span className="preview-bar-label">{l}</span>
                                    <div className="preview-bar-track">
                                        <div className="preview-bar-fill" style={{ width: `${v}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="auth-preview-card side-card">
                        <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
                            🎯 Today's Goals
                        </div>
                        <span className="preview-tag">Complete Module 4</span>
                        <span className="preview-tag green">Quiz Done ✓</span>
                        <span className="preview-tag orange">Practice JS</span>
                        <div style={{ marginTop: '0.6rem', fontSize: '0.58rem', color: '#9ca3af' }}>
                            AI Mentor ready →
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Right Form Panel ── */}
            <div className="auth-right">
                <div className="auth-card">
                    <Link to="/" className="auth-back-btn">
                        <FiArrowLeft size={13} /> Back
                    </Link>

                    <h2 className="auth-title">Create Account</h2>
                    <p className="auth-subtitle">Start your personalized learning journey today.</p>

                    {error && <div className="auth-error">{error}</div>}

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label htmlFor="signup-name">Full Name</label>
                            <input
                                id="signup-name"
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="John Doe"
                                required
                                autoComplete="name"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="signup-email">Email Address</label>
                            <input
                                id="signup-email"
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="abc@gmail.com"
                                required
                                autoComplete="email"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="signup-password">Password</label>
                            <div className="auth-input-wrapper">
                                <input
                                    id="signup-password"
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Min. 8 characters"
                                    required
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    className="auth-eye-btn"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                >
                                    {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                                </button>
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="signup-confirm">Confirm Password</label>
                            <input
                                id="signup-confirm"
                                type={showPassword ? 'text' : 'password'}
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="Repeat password"
                                required
                                autoComplete="new-password"
                            />
                        </div>

                        <button type="submit" className="auth-submit-btn" disabled={isLoading}>
                            {isLoading ? 'Creating Account…' : 'Create Account'}
                        </button>
                    </form>

                    <p className="auth-footer">
                        Already have an account? <Link to="/login">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Signup;
