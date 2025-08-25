'use client';

import { useState, useEffect } from 'react';
import { Chart } from 'react-google-charts';
import { io } from 'socket.io-client';

export default function GaugeChart() {
  const [value, setValue] = useState<number>(0);
  const [rawValue, setRawValue] = useState<number>(0);
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
        if (parsedData.type === 'gauge-update') {
          setValue(parsedData.value);
          setRawValue(parsedData.rawValue || parsedData.value);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
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
    // let ws: WebSocket | null = null;
    // let reconnectTimeout: NodeJS.Timeout | null = null;

    // const connect = () => {
    //   try {
    //     const wsUrl = `ws://${window.location.hostname}:${window.location.port}`;
    //     console.log('Attempting to connect to:', wsUrl);
    //     ws = new WebSocket(wsUrl);

    //     ws.onopen = () => {
    //       console.log('Connected to WebSocket');
    //       setConnectionStatus('Connected');
    //     };

    //     ws.onmessage = (event) => {
    //       try {
    //         const data = JSON.parse(event.data);
    //         if (data.type === 'gauge-update') {
    //           setValue(data.value);
    //           setRawValue(data.rawValue || data.value);
    //         }
    //       } catch (error) {
    //         console.error('Error parsing WebSocket message:', error);
    //       }
    //     };

    //     ws.onclose = (event) => {
    //       console.log('Disconnected from WebSocket', event.code, event.reason);
    //       setConnectionStatus('Disconnected');
          
    //       // Only attempt to reconnect if it wasn't a normal closure
    //       if (event.code !== 1000) {
    //         reconnectTimeout = setTimeout(() => {
    //           console.log('Attempting to reconnect...');
    //           setConnectionStatus('Reconnecting');
    //           connect();
    //         }, 3000);
    //       }
    //     };

    //     ws.onerror = (error) => {
    //       console.error('WebSocket error:', error);
    //       setConnectionStatus('Error');
    //     };

    //   } catch (error) {
    //     console.error('Failed to create WebSocket connection:', error);
    //     setConnectionStatus('Error');
    //   }
    // };

    // connect();

    // return () => {
    //   if (reconnectTimeout) {
    //     clearTimeout(reconnectTimeout);
    //   }
    //   if (ws) {
    //     ws.close(1000, 'Component unmounting');
    //   }
    // };
  }, []);

  const data = [
    ['Label', 'Value'],
    ['Value', value],
  ];

  const options = {
    width: 400,
    height: 300,
    redFrom: 90,
    redTo: 100,
    yellowFrom: 75,
    yellowTo: 90,
    minorTicks: 5,
    max: 100,
    min: 0,
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <h2 className="text-xl font-semibold">Pending Files Monitor</h2>
      <div className="flex items-center gap-2">
        <span className="text-sm">Status:</span>
        <span className={`text-sm font-medium ${
          connectionStatus === 'Connected' ? 'text-green-600' : 
          connectionStatus === 'Error' ? 'text-red-600' : 
          connectionStatus === 'Reconnecting' ? 'text-yellow-600' :
          'text-gray-600'
        }`}>
          {connectionStatus}
        </span>
      </div>
      <Chart
        chartType="Gauge"
        data={data}
        options={options}
        width="400px"
        height="300px"
      />
      <div className="text-center">
        <p className="text-lg font-mono">Gauge Value: {value}</p>
        <p className="text-sm text-gray-600">Raw Pending Files: {rawValue}</p>
      </div>
    </div>
  );
}