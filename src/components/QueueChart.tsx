'use client';

import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

interface QueueData {
  inProgress: number;
  retry: number;
  queued: number;
  finished: number;
  workers: number;
}

interface BarData {
  label: string;
  value: number;
  color: string;
}

export default function QueueChart() {
  const [queueData, setQueueData] = useState<QueueData>({
    inProgress: 0,
    retry: 0,
    queued: 0,
    finished: 0,
    workers: 0
  });
  const [connectionStatus, setConnectionStatus] = useState<string>('Disconnected');

  useEffect(() => {
    // Use the current page's origin for Socket.IO connection
    const socket = io(window.location.origin, {
      transports: ['polling', 'websocket'],
      upgrade: true,
      rememberUpgrade: true,
      timeout: 5000,
      forceNew: true
    });
    
    socket.on('connect', () => {
      console.log('Connected to server');
      setConnectionStatus('Connected');
    });

    socket.on('message', (data) => {
      try {
        console.log('Received message:', data);
        const parsedData = JSON.parse(data);
        if (parsedData.type === 'queue-update') {
          setQueueData({
            inProgress: parsedData.inProgress || 0,
            retry: parsedData.retry || 0,
            queued: parsedData.queued || 0,
            finished: parsedData.finished || 0,
            workers: parsedData.workers || 0
          });
        }
      } catch (error) {
        console.error('Error parsing Socket message:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnectionStatus('Disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setConnectionStatus('Error');
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
      setConnectionStatus('Error');
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const getColor = (value: number): string => {
    if (value <= 25) return '#3B82F6'; // light-blue
    if (value <= 75) return '#10B981'; // light-green
    return '#EF4444'; // red
  };

  const bars: BarData[] = [
    { label: 'In Progress', value: queueData.inProgress, color: getColor(queueData.inProgress) },
    { label: 'Retry', value: queueData.retry, color: getColor(queueData.retry) },
    { label: 'Queued', value: queueData.queued, color: getColor(queueData.queued) },
    { label: 'Finished', value: queueData.finished, color: getColor(queueData.finished) }
  ];

  let maxValue = Math.max(...bars.map(b => b.value), 100);
  if (maxValue > 100) maxValue = 100;

  return (
    <div className="fixed top-4 left-4 w-3/7 h-1/2 bg-white border border-gray-300 rounded-lg shadow-lg p-3 flex flex-col gap-2 overflow-hidden">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Queue Status</h2>
        <div className={`w-2 h-2 rounded-full ${
          connectionStatus === 'Connected' ? 'bg-green-500' : 
          connectionStatus === 'Error' ? 'bg-red-500' : 
          connectionStatus === 'Reconnecting' ? 'bg-yellow-500' :
          'bg-gray-500'
        }`} />
      </div>

      <div className="flex-1 space-y-1 overflow-hidden">
        {bars.map((bar, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="w-12 text-xs font-medium text-right truncate">
              {bar.label.split(' ')[0]}
            </div>
            <div className="flex-1 relative">
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-300 ease-in-out"
                  style={{ 
                    width: `${Math.min((bar.value / maxValue) * 100, 100)}%`,
                    backgroundColor: bar.color
                  }}
                />
              </div>
              <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700">
                {bar.value}
              </div>
            </div>
            <div className="w-8 text-xs text-gray-600">
              {bar.value >= 100 ? "99+" : bar.value}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between text-xs">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-blue-500 rounded"></div>
          <span>Low</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded"></div>
          <span>Med</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-red-500 rounded"></div>
          <span>High</span>
        </div>
      </div>

      <div className="text-center text-xs text-gray-600">
        Total: {queueData.inProgress + queueData.retry + queueData.queued + queueData.finished}
      </div>
    </div>
  );
}