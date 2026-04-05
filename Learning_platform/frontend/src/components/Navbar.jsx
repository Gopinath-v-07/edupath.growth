import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiBell, FiUser, FiMoreVertical, FiMenu } from 'react-icons/fi';
import { fetchMe } from '../services/api';
import './Navbar.css';

const Navbar = ({ onMenuClick }) => {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [streak, setStreak] = useState(0);
    const [userName, setUserName] = useState('');
    const profileRef = useRef(null);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    // Fetch streak (and user name) once when authenticated
    useEffect(() => {
        if (!token) return;
        fetchMe()
            .then(res => {
                if (res.data.streak) {
                    setStreak(res.data.streak.current_streak ?? 0);
                }
                const fullName = res.data.profile?.full_name || res.data.name || '';
                setUserName(fullName);
            })
            .catch(() => {}); // silent fail — streak is cosmetic
    }, [token]);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const displayName = userName || 'User';
    const handle = '@' + displayName.replace(/\s+/g, '-').toLowerCase();

    return (
        <nav className="navbar">
            {/* Left: Hamburger (mobile) + Brand */}
            <div className="navbar-left">
                {/* Hamburger — shown on mobile only when authenticated */}
                {token && (
                    <button
                        className="navbar-hamburger"
                        onClick={onMenuClick}
                        aria-label="Open navigation menu"
                    >
                        <FiMenu />
                    </button>
                )}

                {!token && (
                    <div className="navbar-brand">
                        <Link to="/" className="brand-link">
                            Edu<span style={{ color: 'var(--primary)' }}>Path</span>
                        </Link>
                    </div>
                )}
            </div>

            {/* Center links — public nav */}
            <div className="navbar-center-links">
                <Link to="/" className="nav-item">Home</Link>
                <Link to="/works" className="nav-item">How It Works</Link>
                <Link to="/courses" className="nav-item">Programs</Link>
            </div>

            {/* Right: auth actions */}
            <div className="navbar-right-links">
                {token && (
                    <Link to="/dashboard" className="nav-item dashboard-link">
                        Dashboard
                    </Link>
                )}

                {token ? (
                    <div className="nav-actions-container">
                        {/* Notification Bell */}
                        <div className="nav-icon-btn nav-bell-container">
                            <FiBell className="nav-icon" />
                            <span className="nav-badge">2</span>
                        </div>

                        {/* Streak Capsule — live from API */}
                        <div className="nav-streak-capsule" title={`${streak}-day login streak`}>
                            <span className="streak-emoji">{streak > 0 ? '🔥' : '💤'}</span>
                            <span className="streak-count">{streak}</span>
                        </div>

                        {/* Profile dropdown */}
                        <div className="profile-menu-container" ref={profileRef}>
                            <button
                                className="nav-icon-btn profile-btn"
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                aria-label="Open profile menu"
                                aria-expanded={isProfileOpen}
                            >
                                <FiUser className="nav-icon" />
                            </button>

                            {isProfileOpen && (
                                <div className="profile-dropdown">
                                    <div className="dropdown-header">
                                        <div className="dropdown-avatar">
                                            <FiUser />
                                        </div>
                                        <div className="dropdown-user-info">
                                            <span className="dropdown-name">{displayName}</span>
                                            <span className="dropdown-handle">{handle}</span>
                                        </div>
                                        <FiMoreVertical
                                            className="dropdown-open-icon"
                                            onClick={() => navigate('/profile')}
                                        />
                                    </div>
                                    <div className="dropdown-links">
                                        <Link to="/goals" onClick={() => setIsProfileOpen(false)}>
                                            Switch Goal
                                        </Link>
                                        <Link to="/settings" onClick={() => setIsProfileOpen(false)}>
                                            Settings
                                        </Link>
                                        <button onClick={handleLogout} className="dropdown-logout">
                                            Sign out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <>
                        <Link to="/login" className="nav-item margin-right-btn">Login</Link>
                        <Link to="/signup" className="btn btn-sm">Sign Up</Link>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
