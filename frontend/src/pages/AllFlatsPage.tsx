// frontend/src/pages/AllFlatsPage.tsx
import React, { useEffect, useState } from 'react';
import { getAllFlats } from '../services/api';
import FlatList from '../components/flats/FlatList';

const AllFlatsPage: React.FC = () => {
  const [flats, setFlats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchFlats = async () => {
      try {
        setLoading(true);
        const response = await getAllFlats();
        setFlats(response.data);
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching all flats:', err);
        setError('Failed to load flats. Please try again later.');
        setLoading(false);
      }
    };
    fetchFlats();
  }, []);

  if (loading) {
    return <p className="text-text-secondary text-xl">Loading available flats...</p>;
  }

  if (error) {
    return <p className="text-red-600 text-xl">{error}</p>;
  }

  return (
    <div className="bg-surface-card p-8 rounded-4xl shadow-lg border border-border-subtle w-full max-w-5xl">
      <FlatList
        flats={flats}
        title="Available Flats"
        emptyMessage="No flats are currently available. Check back soon!"
      />
    </div>
  );
};

export default AllFlatsPage;

