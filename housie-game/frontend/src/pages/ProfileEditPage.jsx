import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ArrowLeft, Save, Loader2, CheckCircle2 } from 'lucide-react';
import useAuthStore from '../context/useAuthStore';
import './ProfileEditPage.css';

const ProfileEditPage = () => {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || isSaving) return;

    setIsSaving(true);
    setMessage({ type: '', text: '' });

    try {
      await updateProfile(name.trim());
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => navigate('/lobby'), 1500);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="edit-profile-container">
      <div className="edit-card">
        
        {/* Header */}
        <div className="edit-header">
          <button onClick={() => navigate('/lobby')} className="back-btn">
            <ArrowLeft size={20} />
          </button>
          <h2 className="edit-title">Edit Profile</h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="edit-form">
          <div className="avatar-section">
            <div className="large-avatar">
              <User size={48} className="text-slate-400" />
            </div>
            <p className="avatar-hint">Avatar customization coming soon!</p>
          </div>

          <div className="input-group">
            <label className="input-label">Display Name</label>
            <div className="input-wrapper">
              <User className="input-icon" size={18} />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="name-input"
                maxLength={20}
                required
              />
            </div>
          </div>

          {message.text && (
            <div className={`message-box ${message.type}`}>
              {message.type === 'success' && <CheckCircle2 size={16} />}
              <span>{message.text}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSaving || !name.trim()}
            className="save-btn"
          >
            {isSaving ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={18} />
                Save Changes
              </>
            )}
          </button>
        </form>

        <div className="edit-footer">
          <p>Your name is visible to everyone in the game room.</p>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditPage;
