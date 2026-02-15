import React, { useEffect, useState } from 'react';

const Timer = ({ durationInSeconds, onTimeUp, onTick, className }) => {
    const [timeLeft, setTimeLeft] = useState(durationInSeconds);

    useEffect(() => {
        setTimeLeft(durationInSeconds);
    }, [durationInSeconds]);

    useEffect(() => {
        if (timeLeft <= 0) {
            onTimeUp();
            return;
        }

        const timerId = setInterval(() => {
            setTimeLeft((prev) => {
                const newTime = prev - 1;
                if (onTick) onTick(newTime);
                return newTime;
            });
        }, 1000);

        return () => clearInterval(timerId);
    }, [timeLeft, onTimeUp, onTick]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className={`font-mono text-xl font-bold ${timeLeft < 60 ? 'text-red-500' : ''} ${className || ''}`}>
            {formatTime(timeLeft)}
        </div>
    );
};


export default Timer;
