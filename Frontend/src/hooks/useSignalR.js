import { useEffect, useRef } from 'react';
import * as signalR from '@microsoft/signalr';

export const useSignalR = (onNewRequest, onRequestUpdated, onAnnouncementChange, onDocumentTypeChange, onRequirementChange) => {
  const connectionRef = useRef(null);
  const handlersRef = useRef({ onNewRequest, onRequestUpdated, onAnnouncementChange, onDocumentTypeChange, onRequirementChange });

  // Update handlers without reconnecting
  useEffect(() => {
    handlersRef.current = { onNewRequest, onRequestUpdated, onAnnouncementChange, onDocumentTypeChange, onRequirementChange };
  }, [onNewRequest, onRequestUpdated, onAnnouncementChange, onDocumentTypeChange, onRequirementChange]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Likayan ang pag-recreate kon naa nay existing connection nga connected/connecting
    if (connectionRef.current) return;

    let isStopped = false; // Flag para sa cleanup

    const connection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:5097/hubs/requests', {
        accessTokenFactory: () => localStorage.getItem('token')
      })
      .withAutomaticReconnect([0, 2000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Information) // More detailed logging for debugging
      .build();

    // Event Registration (same as your logic)
    connection.on('NewRequest', (data) => {
      console.log('📨 Received NewRequest:', data);
      handlersRef.current.onNewRequest?.(data);
    });
    connection.on('RequestUpdated', (data) => {
      console.log('🔄 Received RequestUpdated:', data);
      handlersRef.current.onRequestUpdated?.(data);
    });
    connection.on('AnnouncementCreated', (data) => {
      console.log('📢 Received AnnouncementCreated:', data);
      handlersRef.current.onAnnouncementChange?.(data, 'created');
    });
    connection.on('AnnouncementUpdated', (data) => {
      console.log('📢 Received AnnouncementUpdated:', data);
      handlersRef.current.onAnnouncementChange?.(data, 'updated');
    });
    connection.on('DocumentTypeCreated', (data) => {
      console.log('📄 Received DocumentTypeCreated:', data);
      handlersRef.current.onDocumentTypeChange?.(data, 'created');
    });
    connection.on('DocumentTypeUpdated', (data) => {
      console.log('📄 Received DocumentTypeUpdated:', data);
      handlersRef.current.onDocumentTypeChange?.(data, 'updated');
    });
    connection.on('RequirementUpdated', (data) => {
      console.log('📋 Received RequirementUpdated:', data);
      handlersRef.current.onRequirementChange?.(data);
    });

    // Connection state event handlers
    connection.onreconnecting((error) => {
      console.log('🔄 SignalR Reconnecting...', error);
    });

    connection.onreconnected((connectionId) => {
      console.log('✅ SignalR Reconnected with ID:', connectionId);
    });

    connection.onclose((error) => {
      console.log('🔌 SignalR Connection Closed:', error);
    });

    const startConnection = async () => {
      try {
        if (connection.state === signalR.HubConnectionState.Disconnected) {
          console.log('🔄 Attempting SignalR connection...');
          await connection.start();
          if (isStopped) {
            await connection.stop();
          } else {
            console.log('✅ SignalR Connected successfully');
            console.log('🔗 Connection State:', connection.state);
            connectionRef.current = connection;
          }
        }
      } catch (err) {
        if (!isStopped) {
          console.error('❌ SignalR Connection Error:', err.message || err);
          console.log('🔄 Will retry in 5 seconds...');
          // Optional: Re-try human ang pipila ka segundos
          setTimeout(startConnection, 5000);
        }
      }
    };

    startConnection();

    return () => {
      isStopped = true;
      if (connectionRef.current) {
        connectionRef.current.stop().then(() => {
          connectionRef.current = null;
          console.log('🔌 SignalR Disconnected');
        });
      }
    };
  }, []); 

  return connectionRef.current;
};