import React from 'react';
import Header from './Header';
import './Layout.css';

function Layout({ children }) {
  return (
    <div className="app-layout">

      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="main-content">
        {children}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>
          © {new Date().getFullYear()} Housie Multiplayer • All Rights Reserved
        </p>
      </footer>

    </div>
  );
}

export default Layout;