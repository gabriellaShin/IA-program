import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [menuOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMenuOpen(false);
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          Weekly Meal Plan
        </Link>

        <div className="navbar-right" ref={menuRef}>
          <button
            type="button"
            className="navbar-hamburger"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }}
            aria-label="Menu"
            aria-expanded={menuOpen}
          >
            <span className="hamburger-line" />
            <span className="hamburger-line" />
            <span className="hamburger-line" />
          </button>

          {menuOpen && (
            <div className="navbar-dropdown">
              {user ? (
                <>
                  <span className="navbar-dropdown-user">{user.name}</span>
                  <Link to="/meal-plan" className="navbar-dropdown-link" onClick={closeMenu}>
                    Meal Plan
                  </Link>
                  <Link to="/intake-history" className="navbar-dropdown-link" onClick={closeMenu}>
                    Intake History
                  </Link>
                  <Link to="/profile" className="navbar-dropdown-link" onClick={closeMenu}>
                    My Profile
                  </Link>
                  <button onClick={handleLogout} className="navbar-dropdown-link navbar-dropdown-btn">
                    Log Out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="navbar-dropdown-link" onClick={closeMenu}>
                    Log In
                  </Link>
                  <Link to="/register" className="navbar-dropdown-link" onClick={closeMenu}>
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
