import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { FiMap, FiPlus, FiStar, FiClock } from 'react-icons/fi';
import './RoadmapOverview.css';

const RoadmapOverview = () => {
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const { data } = await api.get('/roadmap/courses');
                setCourses(data.courses || []);
            } catch (error) {
                console.error("Failed to fetch roadmaps:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCourses();
    }, []);

    if (loading) return <div className="page-container" style={{ textAlign: 'center', marginTop: '4rem' }}>Loading your roadmaps...</div>;

    return (
        <div className="roadmap-overview-container animate-fade-in">
            <header className="overview-header">
                <div>
                    <h1 className="gradient-text">My Roadmaps</h1>
                    <p className="subtitle">Select a learning path to continue your progress.</p>
                </div>
                <button className="btn" onClick={() => navigate('/create-plan')}>
                    <FiPlus /> New Plan
                </button>
            </header>

            {courses.length === 0 ? (
                <div className="empty-state">
                    <FiMap size={48} color="var(--text-secondary)" />
                    <h2>No learning paths found</h2>
                    <p>Create a new plan to start your journey.</p>
                    <button className="btn" onClick={() => navigate('/create-plan')} style={{ marginTop: '1rem' }}>
                        Create Roadmap
                    </button>
                </div>
            ) : (
                <div className="roadmap-grid">
                    {courses.map(course => {
                        const progress = course.total_topics > 0 
                            ? Math.round((course.completed_topics / course.total_topics) * 100) 
                            : 0;

                        return (
                            <div 
                                key={course.id} 
                                className="roadmap-card"
                                onClick={() => navigate(`/roadmap/${course.id}`)}
                            >
                                <div className="roadmap-card-header">
                                    <div className="roadmap-icon">
                                        <FiStar />
                                    </div>
                                    <div className="progress-badge">{progress}% Complete</div>
                                </div>
                                <h3 className="roadmap-title">{course.title}</h3>
                                <div className="roadmap-stats">
                                    <span><FiClock /> {course.total_topics} Days / Topics</span>
                                    <span>{course.completed_topics} Completed</span>
                                </div>
                                <div className="mini-progress-bar">
                                    <div className="mini-progress-fill" style={{ width: `${progress}%` }}></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default RoadmapOverview;
