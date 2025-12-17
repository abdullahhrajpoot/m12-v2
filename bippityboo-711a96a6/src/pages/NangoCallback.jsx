import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function NangoCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    // This page is loaded in the popup after Nango OAuth completes
    // We need to notify the parent window and close the popup
    
    // Check if we're in a popup (opened by ConnectButton)
    if (window.opener) {
      // Send success message to parent window
      window.opener.postMessage({ 
        type: 'NANGO_OAUTH_SUCCESS',
        connectionId: searchParams.get('connection_id') || searchParams.get('connectionId')
      }, window.location.origin);
      
      // Close the popup
      setTimeout(() => {
        window.close();
      }, 500);
    } else {
      // If not in a popup, redirect to AllSet page
      navigate('/AllSet');
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-600">Completing connection...</p>
      </div>
    </div>
  );
}

