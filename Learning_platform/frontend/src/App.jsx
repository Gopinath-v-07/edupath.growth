import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import LandingPage from './pages/LandingPage';
import HowItWorks from './pages/HowItWorks';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Onboarding from './pages/Onboarding';
import CompleteProfile from './pages/CompleteProfile';
import Profile from './pages/Profile';
import Goals from './pages/Goals';
import CreatePlan from './pages/CreatePlan';
import Assessment from './pages/Assessment';
import Analysis from './pages/Analysis';
import Dashboard from './pages/Dashboard';
import Roadmap from './pages/Roadmap';
import RoadmapOverview from './pages/RoadmapOverview';
import Topic from './pages/Topic';
import Quiz from './pages/Quiz';
import AIMentor from './pages/AIMentor';
import Groups from './pages/Groups';
import GroupDashboard from './pages/GroupDashboard';
import './index.css';

const PrivateRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    return token ? children : <Navigate to="/login" />;
};

// Routes without sidebar (public + onboarding)
const PUBLIC_ROUTES = ['/', '/login', '/signup', '/works'];
const NO_SIDEBAR_ROUTES = ['/onboarding', '/complete-profile', '/assessment'];

const AppLayout = () => {
    const location = useLocation();
    const isPublicPage = PUBLIC_ROUTES.includes(location.pathname);
    const hideSidebar = isPublicPage || NO_SIDEBAR_ROUTES.includes(location.pathname);

    // Mobile sidebar open/close state
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className={!hideSidebar ? 'pro-dashboard-layout' : ''}>
            {/* Sidebar — only shown in authenticated dashboard pages */}
            {!hideSidebar && (
                <Sidebar
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                />
            )}

            <div className={!hideSidebar ? 'dashboard-main-content' : ''}>
                {/* Navbar — pass hamburger handler */}
                <Navbar onMenuClick={() => setSidebarOpen(prev => !prev)} />

                <div className={!hideSidebar ? 'dashboard-main-scrollable' : ''}>
                    <Routes>
                        {/* Public */}
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/works" element={<HowItWorks />} />
                        <Route path="/courses" element={<Navigate to="/roadmap" replace />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />

                        {/* Auth — no sidebar */}
                        <Route path="/onboarding" element={<PrivateRoute><Onboarding /></PrivateRoute>} />
                        <Route path="/complete-profile" element={<PrivateRoute><CompleteProfile /></PrivateRoute>} />

                        {/* Auth — with sidebar */}
                        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
                        <Route path="/settings" element={<PrivateRoute><Profile /></PrivateRoute>} />
                        <Route path="/goals" element={<PrivateRoute><Goals /></PrivateRoute>} />
                        <Route path="/create-plan" element={<PrivateRoute><CreatePlan /></PrivateRoute>} />
                        <Route path="/assessment" element={<PrivateRoute><Assessment /></PrivateRoute>} />
                        <Route path="/analysis" element={<PrivateRoute><Analysis /></PrivateRoute>} />
                        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                        <Route path="/roadmap" element={<PrivateRoute><RoadmapOverview /></PrivateRoute>} />
                        <Route path="/roadmap/:courseId" element={<PrivateRoute><Roadmap /></PrivateRoute>} />
                        <Route path="/topic/:topicId" element={<PrivateRoute><Topic /></PrivateRoute>} />
                        <Route path="/quiz/:topicId" element={<PrivateRoute><Quiz /></PrivateRoute>} />
                        <Route path="/mentor" element={<PrivateRoute><AIMentor /></PrivateRoute>} />
                        <Route path="/groups" element={<PrivateRoute><Groups /></PrivateRoute>} />
                        <Route path="/group/:groupId/dashboard" element={<PrivateRoute><GroupDashboard /></PrivateRoute>} />
                    </Routes>
                </div>
            </div>
        </div>
    );
};

function App() {
    return (
        <Router>
            <AppLayout />
        </Router>
    );
}

export default App;
