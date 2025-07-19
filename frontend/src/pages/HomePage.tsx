// frontend/src/pages/HomePage.tsx
import React from 'react';

const HomePage: React.FC = () => {
  return (
    <div className="text-center p-8 bg-card rounded-lg shadow-md border border-border text-card-foreground"> 
      <h2 className="text-4xl font-bold mb-4 text-foreground">Welcome to Flat Management System</h2> 
      <p className="text-xl text-muted-foreground">Find your perfect flat or manage your properties with ease.</p> 
      <p className="mt-4 text-muted-foreground text-sm font-normal">
        Login or Register to get started.
      </p>
    </div>
  );
};

export default HomePage;
