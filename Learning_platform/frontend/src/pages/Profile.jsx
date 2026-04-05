import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { fetchMe, uploadProfileImage } from '../services/api';
import { FiUser, FiSettings, FiAward, FiEdit3, FiMail, FiCamera } from 'react-icons/fi';
import './Profile.css';

const Profile = () => {
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploadingImage, setUploadingImage] = useState(false);
    const navigate = useNavigate();

    const handleImageUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            setUploadingImage(true);
            const formData = new FormData();
            formData.append('file', file);
            const { data } = await uploadProfileImage(formData);

            setUserProfile((prev) => ({
                ...(prev || {}),
                profile_image_url: data.image_url,
            }));
        } catch (error) {
            console.error('Failed to upload profile image', error);
            alert(error.response?.data?.detail || 'Failed to upload profile image.');
        } finally {
            setUploadingImage(false);
            event.target.value = '';
        }
    };

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const { data } = await fetchMe();
                if (!data.has_profile) {
                    navigate('/complete-profile');
                    return;
                }
                setUserProfile(data.profile);
            } catch (error) {
                console.error("Failed to load profile details", error);
            } finally {
                setLoading(false);
            }
        };
        loadProfile();
    }, [navigate]);

    return (
        <main className="dashboard-main animate-fade-in">
            {loading ? (
                    <div style={{ textAlign: 'center', marginTop: '4rem' }}>Loading your profile...</div>
                ) : (
                    <>
                        <header className="profile-header">
                            <div className="profile-info-header">
                                <div className="profile-avatar">
                                    {userProfile?.profile_image_url ? (
                                        <img
                                            src={userProfile.profile_image_url}
                                            alt="Profile"
                                            className="profile-avatar-image"
                                        />
                                    ) : (
                                        <FiUser size={48} />
                                    )}
                                    <label className="profile-avatar-upload" title="Upload profile image">
                                        <FiCamera size={14} />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            disabled={uploadingImage}
                                        />
                                    </label>
                                </div>
                                <div className="profile-titles">
                                    <h2>{userProfile?.full_name || 'Learner'}</h2>
                                    <span className="profile-badge">{userProfile?.degree || 'Student'} • {userProfile?.department || ''}</span>
                                </div>
                            </div>
                            <button className="btn btn-secondary" onClick={() => navigate('/complete-profile')} style={{ padding: '0.9rem 2rem', whiteSpace: 'nowrap' }}>
                                <FiEdit3 /> Edit Profile
                            </button>
                        </header>

                        <div className="profile-content-grid">
                            <div className="profile-card">
                                <h3><FiAward style={{ marginRight: '8px' }} /> Learning Goals</h3>
                                <div className="goal-section">
                                    <h4>Short Term Focus</h4>
                                    <p>{userProfile?.short_term_goal || "Not set yet"}</p>
                                </div>
                                <div className="goal-section">
                                    <h4>Long Term Career Goal</h4>
                                    <p>{userProfile?.long_term_goal || "Not set yet"}</p>
                                </div>
                                <button className="btn btn-secondary" onClick={() => navigate('/goals')}>
                                    Update Goals
                                </button>
                            </div>

                            <div className="profile-card">
                                <h3><FiMail style={{ marginRight: '8px' }} /> Learning Reports</h3>
                                <div className="goal-section">
                                    <h4>Receive Curriculum</h4>
                                    <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
                                        Send your active learning plan directly to your email address ({userProfile?.email || "on file"}).
                                    </p>
                                </div>
                                <button 
                                    className="btn btn-primary" 
                                    onClick={async (e) => {
                                        const btn = e.currentTarget;
                                        const originalText = btn.innerHTML;
                                        
                                        try {
                                            btn.innerHTML = 'Sending...';
                                            btn.disabled = true;
                                            
                                            // Fetch the user's latest course to populate the direct email
                                            const { data: coursesData } = await api.get('/roadmap/courses');
                                            const latestCourse = coursesData.courses[0];
                                            
                                            if (!latestCourse) {
                                                alert("No active learning plan found to email. Please complete an assessment first.");
                                                btn.innerHTML = originalText;
                                                btn.disabled = false;
                                                return;
                                            }
                                            
                                            const { data: topicsData } = await api.get(`/roadmap/course/${latestCourse.id}/topics`);
                                            
                                            // Call the direct HTML email endpoint instead of PDF form data, since we aren't rendering a PDF component on this page
                                            await api.post('/email/send-report', {
                                                course_title: latestCourse.title,
                                                topics: topicsData.topics || [],
                                            });
                                            
                                            btn.innerHTML = '<span style="display:flex;align-items:center;gap:0.5rem;"><svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><polyline points="20 6 9 17 4 12"></polyline></svg> Sent to Email!</span>';
                                            btn.style.backgroundColor = '#10B981';
                                            
                                            setTimeout(() => {
                                                btn.innerHTML = originalText;
                                                btn.disabled = false;
                                                btn.style.backgroundColor = '';
                                            }, 4000);
                                        } catch (err) {
                                            console.error(err);
                                            btn.innerHTML = 'Failed (Check Server Terminal/env credentials)';
                                            btn.style.backgroundColor = '#EF4444';
                                            setTimeout(() => {
                                                btn.innerHTML = originalText;
                                                btn.disabled = false;
                                                btn.style.backgroundColor = '';
                                            }, 4000);
                                        }
                                    }}
                                >
                                    <FiMail style={{ marginRight: '0.4rem' }} /> Email Active Learning Plan
                                </button>
                            </div>

                            <div className="profile-card">
                                <h3><FiSettings style={{ marginRight: '8px' }} /> Preferences</h3>
                                <ul className="preference-list">
                                    <li>
                                        <strong>Learning Mode:</strong>
                                        <span>{userProfile?.preferred_mode || 'Syllabus Based'}</span>
                                    </li>
                                    <li>
                                        <strong>Skill Confidence:</strong>
                                        <span>{userProfile?.confidence_level || 'Beginner'}</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </>
                )}
            </main>
    );
};

export default Profile;
