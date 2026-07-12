import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, Bell } from 'lucide-react';

const Navbar = ({ searchTerm, setSearchTerm }) => {
  const { user } = useAuth();

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <nav className="navbar">
      <div className="search-bar">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          placeholder="Search registration number, drivers or trips..."
          value={searchTerm || ''}
          onChange={(e) => setSearchTerm && setSearchTerm(e.target.value)}
        />
      </div>

      <div className="navbar-right">
        <div className="notification-bell" title="No new alerts">
          <Bell size={20} />
          <span className="bell-badge"></span>
        </div>

        <div className="profile-widget">
          <div className="profile-details">
            <span className="profile-name">{user ? user.name : 'Raven K.'}</span>
            <span className="profile-role">{user ? user.role : 'Dispatcher'}</span>
          </div>
          <div className="profile-avatar">
            {getInitials(user ? user.name : 'Raven K')}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
