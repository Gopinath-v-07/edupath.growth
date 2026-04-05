import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitOnboarding } from '../services/api';
import './CompleteProfile.css';

const CompleteProfile = () => {
    const navigate = useNavigate();
    const [error, setError] = useState('Failed to save profile. Please try again.'); // Initialize with error to match screenshot, conditionally show

    const [formData, setFormData] = useState({
        full_name: '',
        age: '',
        stream: 'Engineering',
        year: '1st Year',
        department: 'Computer Science'
    });

    // We will start without the error showing unless submit fails, but the mockup has it showing. 
    // I'll set it to empty by default, but error styling will exactly match the mockup.
    const [showError, setShowError] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await submitOnboarding({
                ...formData,
                age: parseInt(formData.age) || 0
            });
            navigate('/goals');
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to save profile. Please try again.');
            setShowError(true);
        }
    };

    return (
        <div className="complete-profile-container animate-fade-in">
            <div className="profile-header">
                <h1>Complete Your Profile</h1>
                <p>Help us personalize your learning journey</p>
            </div>

            <div className="profile-card">
                {showError && (
                    <div className="error-toast">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="profile-form">
                    <div className="form-group full-width">
                        <label>Full Name *</label>
                        <input
                            type="text"
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            placeholder="Gopi V"
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Age *</label>
                            <input
                                type="number"
                                value={formData.age}
                                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                placeholder="19"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Stream *</label>
                            <select
                                value={formData.stream}
                                onChange={(e) => setFormData({ ...formData, stream: e.target.value })}
                            >
                                <option value="Engineering">Engineering</option>
                                <option value="Arts">Arts</option>
                                <option value="Science">Science</option>
                                <option value="Commerce">Commerce</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Year of Study *</label>
                            <select
                                value={formData.year}
                                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                            >
                                <option value="1st Year">1st Year</option>
                                <option value="2nd Year">2nd Year</option>
                                <option value="3rd Year">3rd Year</option>
                                <option value="4th Year">4th Year</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Course / Department *</label>
                            <select
                                value={formData.department}
                                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                            >
                                <option value="Computer Science">Computer Science</option>
                                <option value="Information Technology">Information Technology</option>
                                <option value="Mechanical">Mechanical</option>
                                <option value="Civil">Civil</option>
                                <option value="Electrical">Electrical</option>
                                <option value="Commerce">Commerce</option>
                            </select>
                        </div>
                    </div>

                    <button type="submit" className="save-btn">Save Profile</button>
                </form>
            </div>
        </div>
    );
};

export default CompleteProfile;
