import React, { useEffect, useState } from 'react';
import './LiveStatusIndicator.css';

const LiveStatusIndicator = ({ groupId, userId, initialStatus = "Offline" }) => {
    const [status, setStatus] = useState(initialStatus);

    useEffect(() => {
        // In a real app, this should probably be a shared WebSocket connection at the GroupDashboard level
        // For simplicity in this component, we'll demonstrate the UI, but assume the parent passes the status
        // OR we can connect here. Given we want it real-time, let's assume the parent passes it or we connect.
        // For now, we'll just use the prop to render the correct color.

        setStatus(initialStatus);
    }, [initialStatus]);

    const getStatusColor = (s) => {
        switch (s) {
            case "Studying": return "#28a745"; // Green
            case "Idle": return "#ffc107"; // Yellow
            case "Offline": return "#dc3545"; // Red
            default: return "#6c757d"; // Gray
        }
    };

    return (
        <div className="live-status-indicator" title={status}>
            <span className="status-dot" style={{ backgroundColor: getStatusColor(status) }}></span>
            <span className="status-text">{status}</span>
        </div>
    );
};

export default LiveStatusIndicator;
