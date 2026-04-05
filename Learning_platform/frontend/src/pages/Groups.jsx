import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyGroups, createGroup, joinGroup } from '../services/api';
import { FiUsers, FiPlus, FiArrowRight } from 'react-icons/fi';
import './Groups.css';

const Groups = () => {
    const navigate = useNavigate();
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);

    // Forms
    const [newGroupName, setNewGroupName] = useState('');
    const [joinGroupId, setJoinGroupId] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchGroups = async () => {
        try {
            setLoading(true);
            const { data } = await getMyGroups();
            setGroups(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGroups();
    }, []);

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        if (!newGroupName.trim()) return;
        setActionLoading(true);
        setError(null);
        try {
            const { data } = await createGroup({ name: newGroupName });
            setGroups([...groups, data]);
            setNewGroupName('');
        } catch (err) {
            setError(err.response?.data?.detail || "Failed to create group.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleJoinGroup = async (e) => {
        e.preventDefault();
        if (!joinGroupId) return;
        setActionLoading(true);
        setError(null);
        try {
            const { data } = await joinGroup(joinGroupId);
            // check if already in list
            if (!groups.find(g => g.id === data.id)) {
                setGroups([...groups, data]);
            }
            setJoinGroupId('');
        } catch (err) {
            setError(err.response?.data?.detail || "Failed to join group.");
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <main className="dashboard-main animate-fade-in">
                <header className="dashboard-header groups-header">
                    <div>
                        <h2><FiUsers style={{ marginRight: '10px' }} /> Group Study Spaces</h2>
                        <p>Collaborate, compete, and learn together.</p>
                    </div>
                </header>

                {error && <div className="error-toast" style={{ marginBottom: '1rem' }}>{error}</div>}

                <div className="groups-action-grid">
                    <form className="group-action-card" onSubmit={handleCreateGroup}>
                        <h3>Create a New Group</h3>
                        <p>Start a new learning space with friends.</p>
                        <div className="group-input-row">
                            <input
                                type="text"
                                className="cyber-input"
                                placeholder="Group Name"
                                value={newGroupName}
                                onChange={(e) => setNewGroupName(e.target.value)}
                                required
                            />
                            <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                                <FiPlus /> Create
                            </button>
                        </div>
                    </form>

                    <form className="group-action-card" onSubmit={handleJoinGroup}>
                        <h3>Join an Existing Group</h3>
                        <p>Have an invite ID? Enter it below.</p>
                        <div className="group-input-row">
                            <input
                                type="number"
                                className="cyber-input"
                                placeholder="Group ID"
                                value={joinGroupId}
                                onChange={(e) => setJoinGroupId(e.target.value)}
                                required
                            />
                            <button type="submit" className="btn btn-secondary" disabled={actionLoading}>
                                <FiArrowRight /> Join
                            </button>
                        </div>
                    </form>
                </div>

                <div className="my-groups-section">
                    <h3>My Active Groups</h3>

                    {loading ? (
                        <p>Loading groups...</p>
                    ) : groups.length === 0 ? (
                        <div className="empty-groups">
                            <FiUsers size={48} color="var(--primary)" />
                            <p>You haven't joined any groups yet.</p>
                        </div>
                    ) : (
                        <div className="groups-grid">
                            {groups.map(group => (
                                <div
                                    key={group.id}
                                    className="group-card"
                                    onClick={() => navigate(`/group/${group.id}/dashboard`)}
                                >
                                    <div className="group-card-header">
                                        <h4>{group.name}</h4>
                                        <span className="group-badge">ID: {group.id}</span>
                                    </div>
                                    <div className="group-card-footer">
                                        <span>{group.members?.length || 1} Members</span>
                                        <button className="btn btn-outline btn-small">Enter Space <FiArrowRight /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
        </main>
    );
};

export default Groups;
