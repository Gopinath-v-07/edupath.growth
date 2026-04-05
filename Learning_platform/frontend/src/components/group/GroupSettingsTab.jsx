import React, { useState } from 'react';
import { updateGroupSettings, removeGroupMember } from '../../services/api';

const GroupSettingsTab = ({ groupData, currentUserId, onGroupUpdate }) => {
    const [name, setName] = useState(groupData?.group?.name || '');
    const [isUpdating, setIsUpdating] = useState(false);
    
    // Check if current user is admin
    const currentUserMember = groupData?.members?.find(m => m.user_id === currentUserId);
    const isAdmin = currentUserMember?.role === 'admin';

    const handleUpdateName = async (e) => {
        e.preventDefault();
        setIsUpdating(true);
        try {
            await updateGroupSettings(groupData.group.id, name);
            alert('Group name updated successfully');
            if (onGroupUpdate) onGroupUpdate();
        } catch (err) {
            console.error('Failed to update name', err);
            alert('Failed to update setting. Are you the admin?');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleRemoveMember = async (userId) => {
        if (!window.confirm('Are you sure you want to remove this member?')) return;
        try {
            await removeGroupMember(groupData.group.id, userId);
            if (onGroupUpdate) onGroupUpdate();
        } catch (err) {
            console.error('Failed to remove member', err);
            alert('Failed to remove member. Are you the admin?');
        }
    };

    if (!groupData) return null;

    return (
        <div className="settings-tab animate-fade-in" style={{ padding: '0', maxWidth: '800px' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: '#0f172a' }}>Group Settings</h2>

            <div style={{ background: '#fff', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border)', marginBottom: '2rem' }}>
                <h3 style={{ margin: '0 0 1rem 0', color: '#1e293b', fontSize: '1.1rem' }}>General Settings</h3>
                <form onSubmit={handleUpdateName} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.4rem', color: '#64748b' }}>Group Name</label>
                        <input 
                            type="text" 
                            className="cyber-input" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={!isAdmin}
                            required
                        />
                    </div>
                    {isAdmin && (
                        <div>
                            <button type="submit" className="btn" disabled={isUpdating}>
                                {isUpdating ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    )}
                </form>
            </div>

            <div style={{ background: '#fff', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
                <h3 style={{ margin: '0 0 1rem 0', color: '#1e293b', fontSize: '1.1rem' }}>Manage Members</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    {groupData.members.map(m => (
                        <div key={m.user_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <img src={m.profile_photo || `https://api.dicebear.com/7.x/initials/svg?seed=${m.name}`} alt="avatar" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <h4 style={{ margin: 0 }}>{m.name}</h4>
                                        {m.role === 'admin' && <span style={{ fontSize: '0.65rem', background: '#fef3c7', color: '#d97706', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 'bold' }}>ADMIN</span>}
                                    </div>
                                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Joined {new Date(m.joined_at || Date.now()).toLocaleDateString()}</span>
                                </div>
                            </div>
                            
                            {(isAdmin && m.role !== 'admin') || currentUserId === m.user_id ? (
                                <button 
                                    onClick={() => handleRemoveMember(m.user_id)}
                                    className="btn-secondary"
                                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', color: '#ef4444', borderColor: '#fee2e2', background: '#fef2f2' }}
                                >
                                    {currentUserId === m.user_id ? 'Leave Group' : 'Remove'}
                                </button>
                            ) : null}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default GroupSettingsTab;
