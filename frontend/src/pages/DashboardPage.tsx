// frontend/src/pages/DashboardPage.tsx
import React from 'react';
import { useAuth } from '../context/AuthContext';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="text-center p-8 bg-surface-card rounded-4xl shadow-lg border border-border-subtle">
      <h2 className="text-4xl font-bold mb-4 text-text-primary">User Dashboard</h2>
      {user ? (
        <p className="text-xl text-text-secondary">Welcome, {user.firstName} ({user.userType})!</p>
      ) : (
        <p className="text-xl text-text-secondary">Welcome to your personalized dashboard!</p>
      )}
      <p className="mt-4 text-text-secondary text-sm font-normal">
        (Content for {user?.userType}s will go here.)
      </p>
    </div>
  );
};

export default DashboardPage;
