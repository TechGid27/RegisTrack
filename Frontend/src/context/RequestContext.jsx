import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import * as React from 'react';
import { requestService } from '../api/RequestService';
import { useSignalR } from '../hooks/useSignalR';
import { UseAuth } from './AuthContext';

const RequestContext = createContext();

export const RequestProvider = ({ children }) => {
  const { user } = UseAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newRequestNotification, setNewRequestNotification] = useState(null);
  const loadTimeoutRef = React.useRef(null);

  // 1. Fetching logic
  const loadRequests = useCallback(async (userId = null) => {
    setLoading(true);
    try {
      const data = userId 
        ? await requestService.getByUser(userId) 
        : await requestService.getAll();
      setRequests(data);
      setError(null);
    } catch (err) {
      setError("Invalid request");
    } finally {
      setLoading(false);
    }
  }, []);

  // SignalR handlers
  const handleNewRequest = useCallback((data) => {
    // Admin receives new request notification
    if (user?.role === 'Admin' || user?.role === 'Staff') {
      setNewRequestNotification(data);
      
      // Debounce loadRequests to avoid rapid calls
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = setTimeout(() => {
        loadRequests();
      }, 500);
      
      // Clear notification after 5 seconds
      setTimeout(() => setNewRequestNotification(null), 5000);
    }
  }, [user, loadRequests]);

  const handleRequestUpdated = useCallback((data) => {
    // Student receives status update — merge all fields including documentUrl
    setRequests(prev =>
      prev.map(req =>
        req.id === data.id
          ? { ...req, status: data.status, updatedAt: data.updatedAt, ...(data.documentUrl && { documentUrl: data.documentUrl }) }
          : req
      )
    );
  }, []);

  // Handlers for announcements, document types, requirements
  const handleAnnouncementChange = useCallback((data, action) => {
    console.log('🎯 Student received announcement change:', data, action);
    // Show notification to student
    setNewRequestNotification({
      type: 'announcement',
      action,
      data
    });
    setTimeout(() => setNewRequestNotification(null), 5000);
  }, []);

  const handleDocumentTypeChange = useCallback((data, action) => {
    console.log('🎯 Student received document type change:', data, action);
    setNewRequestNotification({
      type: 'documentType',
      action,
      data
    });
    setTimeout(() => setNewRequestNotification(null), 5000);
  }, []);

  const handleRequirementChange = useCallback((data) => {
    console.log('🎯 Student received requirement change:', data);
    setNewRequestNotification({
      type: 'requirement',
      data
    });
    setTimeout(() => setNewRequestNotification(null), 5000);
  }, []);

  // Connect to SignalR
  useSignalR(handleNewRequest, handleRequestUpdated, handleAnnouncementChange, handleDocumentTypeChange, handleRequirementChange);

  // 2. Create logic
  const createRequest = useCallback(async (data) => {
    try {
      const newReq = await requestService.create(data);
      setRequests(prev => [newReq, ...prev]);
      return newReq;
    } catch (err) {
      console.error("Create failed:", err);
      throw err;
    }
  }, []);

  const updateRequestStatus = useCallback(async (id, updateData) => {
    setLoading(true);
    try {
      // Tawgon ang service para sa API call
      const updatedReq = await requestService.update(id, updateData);
      
      // I-update ang local state para paspas ang UI feedback
      setRequests(prev => 
        prev.map(req => (String(req.id) === String(id) ? { ...req, ...updatedReq } : req))
      );
      
      return updatedReq;
    } catch (err) {
      console.error("Update failed:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 4. Upload logic
  const uploadDocument = useCallback(async (id, file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      await requestService.upload(id, formData);

      return true;
    } catch (err) {
      console.error("Detailed Error:", err.message);
      return false;
    }
  }, []);

  // 5. Delete logic
  const deleteRequest = useCallback(async (id) => {
    try {
      await requestService.delete(id);
      setRequests(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  }, []);

  const trackByReference = useCallback(async (refNumber) => {
    setLoading(true);
    setError(null);
    try {
      // Siguroha nga naay 'getByReference' sa imong RequestService.js
      const data = await requestService.getByReference(refNumber);
      return data; // I-return ang document record para sa Pop-up
    } catch (err) {
      console.error("Tracking failed:", err);
      setError("Reference number not found.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo(() => ({
    requests,
    loading,
    error,
    newRequestNotification,
    loadRequests,
    createRequest,
    updateRequestStatus, 
    uploadDocument,
    deleteRequest,
    trackByReference
  }), [requests, loading, error, newRequestNotification, loadRequests, createRequest, updateRequestStatus, uploadDocument, deleteRequest, trackByReference]);

  return (
    <RequestContext.Provider value={value}>
      {children}
    </RequestContext.Provider>
  );
};

export const UseRequests = () => {
  const context = useContext(RequestContext);
  if (!context) {
    throw new Error('useRequests must be used within a RequestProvider');
  }
  return context;
};