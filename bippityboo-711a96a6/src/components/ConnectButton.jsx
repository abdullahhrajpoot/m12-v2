import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { twMerge } from 'tailwind-merge';
import { useNavigate } from 'react-router-dom';

export default function ConnectButton({ 
  text = "Sign Up With Google", 
  className = "", 
  children 
}) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const NANGO_SECRET_KEY = '97f5bef5-f1a0-4dcd-b5a7-69fadaba98b0';

  useEffect(() => {
    // Listen for messages from the popup when OAuth completes
    const handleMessage = (event) => {
      // Verify message is from same origin
      if (event.origin !== window.location.origin) {
        return;
      }

      if (event.data?.type === 'NANGO_OAUTH_SUCCESS') {
        setLoading(false);
        toast.success("Successfully connected to Google!");
        // Navigate to AllSet page after successful connection
        setTimeout(() => {
          navigate('/AllSet');
        }, 1000);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [navigate]);

  const handleConnect = async () => {
    setLoading(true);
    // Open popup immediately to avoid browser blocking
    const popup = window.open('', 'google-login', 'width=600,height=700');
    if (popup) {
       popup.document.title = "Connecting...";
       popup.document.body.innerHTML = '<div style="font-family: system-ui; display: flex; justify-content: center; align-items: center; height: 100vh;">Loading secure login...</div>';
    }

    try {
      // Create connect session with callback URL
      const response = await fetch('https://api.nango.dev/connect/sessions', {
          method: 'POST',
          headers: {
              'Authorization': `Bearer ${NANGO_SECRET_KEY}`,
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({
              end_user: {
                  id: 'user-' + Date.now()
              },
              allowed_integrations: ['google']
              // Note: redirect_url should be configured in Nango dashboard provider settings
          })
      });

      const data = await response.json();

      if (!response.ok) {
          if (popup) popup.close();
          throw new Error(JSON.stringify(data.error || data));
      }

      // Get the connect URL from response
      const connectUrl = data.data.connect_link;

      if (popup) {
          popup.location.href = connectUrl;
      } else {
          window.open(connectUrl, '_blank', 'width=600,height=700');
      }

    } catch (error) {
      console.error('Nango Connection Error:', error);
      if (popup) popup.close();
      toast.error("Connection failed. Check console for details.");
      setLoading(false);
    }
  };

  const defaultContent = (
    <>
      <img src="https://www.gstatic.com/images/branding/product/1x/gmail_2020q4_32dp.png" alt="Gmail" className="w-5 h-5" />
      <span>{text}</span>
      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
    </>
  );

  return (
    <button 
      onClick={handleConnect}
      disabled={loading}
      className={twMerge(
        "group relative inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-full font-semibold text-lg transition-all hover:bg-indigo-500 hover:shadow-xl hover:shadow-indigo-500/30 disabled:opacity-70",
        className
      )}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
          Connecting...
        </span>
      ) : (
        children || defaultContent
      )}
    </button>
  );
}