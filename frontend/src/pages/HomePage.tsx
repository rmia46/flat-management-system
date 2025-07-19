// frontend/src/pages/HomePage.tsx
import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"; // IMPORT SHADCN CARD COMPONENTS

const HomePage: React.FC = () => {
  return (
    <Card className="text-center p-8 shadow-md border border-border text-card-foreground"> 
      <CardHeader>
        <CardTitle className="text-4xl font-bold mb-4 text-foreground">Welcome to Flat Management System</CardTitle> 
        <CardDescription className="text-xl text-muted-foreground">Find your perfect flat or manage your properties with ease.</CardDescription> 
      </CardHeader>
      <CardContent>
        <p className="mt-4 text-muted-foreground text-sm font-normal">
          Login or Register to get started.
        </p>
      </CardContent>
    </Card>
  );
};

export default HomePage;
