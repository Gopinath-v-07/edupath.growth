import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
    FiHome, FiMap, FiAward, FiTrendingUp,
    FiMessageCircle, FiUser, FiUsers, FiLogOut, FiX
} from 'react-icons/fi';
import './Sidebar.css';

const NAV_ITEMS = [
    { to: '/dashboard',    icon: <FiHome />,          label: 'Dashboard' },
    { to: '/roadmap',      icon: <FiMap />,           label: 'My Roadmap' },
    { to: '/assessment',   icon: <FiAward />,         label: 'Assessments' },
    { to: '/analysis',     icon: <FiTrendingUp />,    label: 'Progress' },
    { to: '/mentor',       icon: <FiMessageCircle />, label: 'AI Mentor' },
    { to: '/groups',       icon: <FiUsers />,         label: 'Group Study' },
    { to: '/profile',      icon: <FiUser />,          label: 'Profile' },
];

const Sidebar = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const location = useLocation();

    // Close sidebar on route change (mobile)
    useEffect(() => {
        onClose?.();
    }, [location.pathname]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    return (
        <>
            {/* Mobile backdrop */}
            <div
                className={`mobile-backdrop ${isOpen ? 'active' : ''}`}
                onClick={onClose}
                aria-hidden="true"
            />

            <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
                {/* Logo + close button (mobile) */}
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">E</div>
                    <span className="sidebar-logo-text">
                        Edu<span>Path</span>
                    </span>
                    <button className="sidebar-close-btn" onClick={onClose} aria-label="Close menu">
                        <FiX />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="sidebar-nav" aria-label="Main navigation">
                    {NAV_ITEMS.map(({ to, icon, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) =>
                                `sidebar-link${isActive ? ' active' : ''}`
                            }
                            title={label}
                        >
                            <span className="sidebar-icon">{icon}</span>
                            <span className="sidebar-label">{label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Footer */}
                <div className="sidebar-footer">
                    <button className="sidebar-logout-btn" onClick={handleLogout}>
                        <span className="sidebar-icon"><FiLogOut /></span>
                        <span className="sidebar-label">Sign Out</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
