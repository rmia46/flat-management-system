// frontend/src/pages/HomePage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

const HomePage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      // This will navigate to the AllFlatsPage and automatically apply the district filter
      navigate(`/flats?district=${encodeURIComponent(searchTerm.trim().toLowerCase())}`);
    } else {
      // If the search is empty, just navigate to the main flats page
      navigate('/flats');
    }
  };

  return (
    <div className="w-full h-[60vh] max-h-[500px] rounded-lg overflow-hidden relative flex items-center justify-center text-center p-4 shadow-lg border">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{
          // A modern apartment background from Unsplash. You can replace this URL with your own image.
          backgroundImage: "url('https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=2070&auto=format&fit=crop')",
        }}
      ></div>
      
      {/* Dark Overlay for Text Readability */}
      <div className="absolute inset-0 bg-black/60 z-10"></div>

      {/* Centered Content */}
      <div className="relative z-20 flex flex-col items-center space-y-6 text-white max-w-2xl">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-shadow">
          Find Your Next Home
        </h1>
        <p className="text-lg text-white/90 text-shadow-sm">
          Discover the perfect flat for rent. Start your search by entering a district below.
        </p>

        {/* Interactive Search Bar */}
        <form 
          onSubmit={handleSearch} 
          className="w-full max-w-lg bg-white rounded-full p-2 flex items-center shadow-lg transition-transform hover:scale-[1.02]"
        >
          <Input
            type="text"
            placeholder="e.g., Dhaka, Chittagong, Sylhet..."
            className="flex-grow bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-card-foreground text-base"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button type="submit" size="icon" className="rounded-full shrink-0">
            <Search size={20} />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default HomePage;