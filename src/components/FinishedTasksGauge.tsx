'use client';

import { useState, useEffect } from 'react';
// import { Chart } from 'react-google-charts';
import { io } from 'socket.io-client';

// Fallback gauge component
const SimpleGauge = ({ value, max = 1000 }: { value: number; max?: number }) => {
  const percentage = Math.min((value / max) * 100, 100);
  // const angle = (percentage / 100) * 180; // 180 degrees for semicircle
  
  return (
    <div className="relative w-32 h-16">
      <svg width="128" height="64" viewBox="0 0 128 64" className="overflow-visible">
        {/* Background arc */}
        <path
          d="M 10 54 A 54 54 0 0 1 118 54"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="8"
          strokeLinecap="round"
        />
        {/* Progress arc */}
        <path
          d="M 10 54 A 54 54 0 0 1 118 54"
          fill="none"
          stroke={value >= 80 ? '#ef4444' : value >= 50 ? '#eab308' : '#10b981'}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${percentage * 1.7} 1000`}
          className="transition-all duration-500"
        />
        {/* Center text */}
        <text x="64" y="45" textAnchor="middle" className="text-xs font-bold fill-gray-700">
          {value}
        </text>
      </svg>
    </div>
  );
};

export default function FinishedTasksGauge() {
  const [finishedTasks, setFinishedTasks] = useState<number>(0);
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
      console.log('Connected to server (FinishedTasksGauge)');
      setConnectionStatus('Connected');
    });

    socket.on('message', (data) => {
      try {
        console.log('Received message (FinishedTasksGauge):', data);
        const parsedData = JSON.parse(data);
        if (parsedData.type === 'queue-update') {
          setFinishedTasks(parsedData.finished || 0);
        }
      } catch (error) {
        console.error('Error parsing Socket message:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server (FinishedTasksGauge)');
      setConnectionStatus('Disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error (FinishedTasksGauge):', error);
      setConnectionStatus('Error');
    });

    socket.on('error', (error) => {
      console.error('Socket error (FinishedTasksGauge):', error);
      setConnectionStatus('Error');
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Prepare data for the gauge chart
  // const data = [
  //   ['Label', 'Value'],
  //   ['Finished', Math.min(finishedTasks, 1000)], // Cap at 100 for gauge display
  // ];

  // const options = {
  //   width: 280,
  //   height: 220,
  //   redFrom: 80,
  //   redTo: 1000,
  //   yellowFrom: 50,
  //   yellowTo: 80,
  //   greenFrom: 0,
  //   greenTo: 50,
  //   minorTicks: 5,
  //   max: 1000,
  //   min: 0,
  //   majorTicks: ['0', '25', '50', '75', '100','1000'],
  //   animation: {
  //     duration: 500,
  //     easing: 'out'
  //   },
  //   chartArea: {
  //     left: 10,
  //     top: 10,
  //     width: '80%',
  //     height: '80%'
  //   }
  // };

  return (
    <div className="fixed top-4 right-4 w-3/7 h-1/2 bg-white border-2 border-blue-300 rounded-lg shadow-lg p-3 flex flex-col gap-2 overflow-hidden z-50">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Finished Tasks</h2>
        <div className={`w-2 h-2 rounded-full ${
          connectionStatus === 'Connected' ? 'bg-green-500' : 
          connectionStatus === 'Error' ? 'bg-red-500' : 
          connectionStatus === 'Reconnecting' ? 'bg-yellow-500' :
          'bg-gray-500'
        }`} />
      </div>

      <div className="flex-1 flex items-center justify-center overflow-hidden">
        <div className="w-full h-full flex items-center justify-center">
          <SimpleGauge value={Math.min(finishedTasks, 1000)} />
        </div>
      </div>

      <div className="text-center">
        <p className="text-xs font-mono">Count: {finishedTasks}</p>
        <p className="text-xs text-gray-600">
          {finishedTasks >= 1000 ? 'High Volume' : 
           finishedTasks >= 50 ? 'Moderate' : 
           finishedTasks >= 25 ? 'Active' : 'Low'}
        </p>
        <p className="text-xs text-gray-500">
          Status: {connectionStatus}
        </p>
      </div>
    </div>
  );
}