import React, { useState, useEffect } from 'react';

const LeadMagnetPopup = ({ t }) => {
  const [showPopup, setShowPopup] = useState(false);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Show popup after 10 seconds or on exit intent (simplified)
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPopup(true);
    }, 10000); // Show after 10 seconds
    
    // Also show on exit intent (mouse leaving viewport)
    const handleMouseLeave = (e) => {
      if (e.clientY <= 0 && !showPopup) {
        setShowPopup(true);
      }
    };
    
    document.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [showPopup, t]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    
    setSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setSuccess(true);
      setSubmitting(false);
      // In real app, you would send email to your marketing service here
    }, 1500);
  };

  if (success) {
    return (
      <div className="lead-magnet-success">
        <div className="success-content">
          <h3>{t.leadMagnet.title}</h3>
          <p>{t.leadMagnet.description}</p>
          <div className="success-message">
            <p>Check your email for the download link!</p>
            <p className="privacy-note">{t.leadMagnet.privacyNote}</p>
          </div>
          <button 
            onClick={() => setShowPopup(false)}
            className="btn-secondary"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!showPopup) {
    return null;
  }

  return (
    <div className="lead-magnet-popup">
      <div className="popup-overlay" onClick={() => setShowPopup(false)} />
      <div className="popup-content" onClick={(e) => e.stopPropagation()}>
        <div className="popup-header">
          <h3>{t.leadMagnet.title}</h3>
          <button 
            className="popup-close"
            onClick={() => setShowPopup(false)}
            aria-label="Close"
          >
            <span>×</span>
          </button>
        </div>
        <div className="popup-body">
          <p>{t.leadMagnet.description}</p>
          <form onClick={handleSubmit} className="email-form">
            <input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={submitting}
            />
            <button 
              type="submit"
              disabled={submitting || !email}
              className="btn-primary"
            >
              {submitting ? 'Sending...' : t.leadMagnet.buttonText}
            </button>
          </form>
          <p className="privacy-note">{t.leadMagnet.privacyNote}</p>
        </div>
      </div>
    </div>
  );
};

export default LeadMagnetPopup;