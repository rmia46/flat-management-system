// frontend/src/pages/HomePage.tsx
import React from 'react';

const HomePage: React.FC = () => {
  return (
    <div className="text-center p-8 bg-surface-card rounded-4xl shadow-lg border border-border-subtle"> 
      <h2 className="text-4xl font-bold mb-4 text-text-primary">Welcome to Flat Management System</h2> 
      <p className="text-xl text-text-secondary">Find your perfect flat or manage your properties with ease.</p> 
      <p className="mt-4 text-text-secondary text-sm font-normal">
        Login or Register to get started.
      </p>
    </div>
  );
};

export default HomePage;
