import React from 'react';

const ProgressBar = ({ progress }) => {
    return (
        <div className="progress-container" style={styles.container}>
            <div
                className="progress-bar gradient-bg"
                style={{ ...styles.bar, width: `${Math.max(0, Math.min(100, progress))}%` }}
            />
        </div>
    );
};

const styles = {
    container: {
        width: '100%',
        height: '8px',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '4px',
        overflow: 'hidden',
        marginTop: '0.5rem',
    },
    bar: {
        height: '100%',
        background: 'linear-gradient(90deg, var(--primary), var(--secondary))',
        transition: 'width 0.5s ease-out',
    }
};

export default ProgressBar;
