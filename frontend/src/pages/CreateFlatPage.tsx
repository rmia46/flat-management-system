// frontend/src/pages/CreateFlatPage.tsx (COMPLETE FILE)
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { createFlat } from '../services/api';

const CreateFlatPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // State for form fields
  const [formData, setFormData] = useState({
    flatNumber: '',
    floor: '',
    houseName: '',
    houseNumber: '', // Added to state
    address: '',
    latitude: '',
    longitude: '',
    monthlyRentalCost: '',
    utilityCost: '',
    bedrooms: '',
    bathrooms: '',
    balcony: false,
    minimumStay: '',
    description: '',
    status: 'available',
    // Images and amenities will be handled later
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Redirect if not authenticated or not an owner
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else if (user?.userType !== 'owner') {
      navigate('/dashboard'); // Or another appropriate page
    }
  }, [isAuthenticated, user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!user || user.userType !== 'owner') {
        setError('You must be an owner to list a flat.');
        return;
    }

    // Basic validation for latitude/longitude as numbers (optional if you want to allow empty)
    if (formData.latitude && isNaN(parseFloat(formData.latitude))) {
        setError('Latitude must be a valid number.');
        return;
    }
    if (formData.longitude && isNaN(parseFloat(formData.longitude))) {
        setError('Longitude must be a valid number.');
        return;
    }
    if (!formData.address || !formData.monthlyRentalCost) {
        setError('Address and Monthly Rent are required fields.');
        return;
    }

    setLoading(true);
    try {
      // Convert relevant fields to numbers
      const dataToSend = {
        ...formData,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        monthlyRentalCost: parseFloat(formData.monthlyRentalCost),
        utilityCost: formData.utilityCost ? parseFloat(formData.utilityCost) : null,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
        floor: formData.floor ? parseInt(formData.floor) : null, // Ensure floor is parsed
        minimumStay: formData.minimumStay ? parseInt(formData.minimumStay) : null,
      };

      const res = await createFlat(dataToSend);
      setSuccessMessage('Flat listed successfully! Redirecting to dashboard...');
      console.log('Flat creation response:', res.data);

      // Clear form or redirect
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000); // Redirect after 2 seconds
    } catch (err: any) {
      console.error('Error creating flat:', err.response ? err.response.data : err.message);
      setError(err.response?.data?.message || 'Failed to list flat. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface-card p-8 rounded-4xl shadow-lg w-full max-w-2xl border border-border-subtle">
      <h2 className="text-3xl font-bold text-center mb-6 text-text-primary">List Your Flat</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-red-600 text-center font-normal">{error}</p>}
        {successMessage && <p className="text-green-600 text-center font-normal">{successMessage}</p>}

        {/* Address */}
        <div>
          <label htmlFor="address" className="block text-text-secondary text-sm font-medium mb-1">Full Address (Street, City, Area, Country):</label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            className="shadow-sm rounded-full w-full py-2 px-3 bg-input-bg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-accent transition duration-200 font-normal"
            required
          />
        </div>

        {/* Latitude and Longitude - Manual Input */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label htmlFor="latitude" className="block text-text-secondary text-sm font-medium mb-1">Latitude (Optional):</label>
                <input
                    type="text" // Can be text for decimal points, parsed to float later
                    id="latitude"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleChange}
                    className="shadow-sm rounded-full w-full py-2 px-3 bg-input-bg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-accent transition duration-200 font-normal"
                />
            </div>
            <div>
                <label htmlFor="longitude" className="block text-text-secondary text-sm font-medium mb-1">Longitude (Optional):</label>
                <input
                    type="text" // Can be text for decimal points, parsed to float later
                    id="longitude"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleChange}
                    className="shadow-sm rounded-full w-full py-2 px-3 bg-input-bg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-accent transition duration-200 font-normal"
                />
            </div>
        </div>

        {/* Basic Flat Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="flatNumber" className="block text-text-secondary text-sm font-medium mb-1">Flat Number:</label>
            <input type="text" id="flatNumber" name="flatNumber" value={formData.flatNumber} onChange={handleChange}
                className="shadow-sm appearance-none rounded-full w-full py-2 px-3 bg-input-bg text-text-primary leading-tight focus:outline-none focus:ring-2 focus:ring-primary-accent transition duration-200 font-normal" />
          </div>
          <div>
            <label htmlFor="floor" className="block text-text-secondary text-sm font-medium mb-1">Floor:</label>
            <input type="number" id="floor" name="floor" value={formData.floor} onChange={handleChange}
                className="shadow-sm appearance-none rounded-full w-full py-2 px-3 bg-input-bg text-text-primary leading-tight focus:outline-none focus:ring-2 focus:ring-primary-accent transition duration-200 font-normal" />
          </div>
          <div>
            <label htmlFor="houseName" className="block text-text-secondary text-sm font-medium mb-1">House Name:</label>
            <input type="text" id="houseName" name="houseName" value={formData.houseName} onChange={handleChange}
                className="shadow-sm appearance-none rounded-full w-full py-2 px-3 bg-input-bg text-text-primary leading-tight focus:outline-none focus:ring-2 focus:ring-primary-accent transition duration-200 font-normal" />
          </div>
          {/* --- HOUSE NUMBER INPUT FIELD --- */}
          <div>
            <label htmlFor="houseNumber" className="block text-text-secondary text-sm font-medium mb-1">House Number:</label>
            <input type="text" id="houseNumber" name="houseNumber" value={formData.houseNumber} onChange={handleChange}
                className="shadow-sm appearance-none rounded-full w-full py-2 px-3 bg-input-bg text-text-primary leading-tight focus:outline-none focus:ring-2 focus:ring-primary-accent transition duration-200 font-normal" />
          </div>
          {/* --- END HOUSE NUMBER INPUT FIELD --- */}
          <div>
            <label htmlFor="monthlyRentalCost" className="block text-text-secondary text-sm font-medium mb-1">Monthly Rent (BDT):</label>
            <input type="number" id="monthlyRentalCost" name="monthlyRentalCost" value={formData.monthlyRentalCost} onChange={handleChange}
                className="shadow-sm appearance-none rounded-full w-full py-2 px-3 bg-input-bg text-text-primary leading-tight focus:outline-none focus:ring-2 focus:ring-primary-accent transition duration-200 font-normal" required />
          </div>
          <div>
            <label htmlFor="utilityCost" className="block text-text-secondary text-sm font-medium mb-1">Utility Cost (BDT, optional):</label>
            <input type="number" id="utilityCost" name="utilityCost" value={formData.utilityCost} onChange={handleChange}
                className="shadow-sm appearance-none rounded-full w-full py-2 px-3 bg-input-bg text-text-primary leading-tight focus:outline-none focus:ring-2 focus:ring-primary-accent transition duration-200 font-normal" />
          </div>
          <div>
            <label htmlFor="bedrooms" className="block text-text-secondary text-sm font-medium mb-1">Bedrooms:</label>
            <input type="number" id="bedrooms" name="bedrooms" value={formData.bedrooms} onChange={handleChange}
                className="shadow-sm appearance-none rounded-full w-full py-2 px-3 bg-input-bg text-text-primary leading-tight focus:outline-none focus:ring-2 focus:ring-primary-accent transition duration-200 font-normal" />
          </div>
          <div>
            <label htmlFor="bathrooms" className="block text-text-secondary text-sm font-medium mb-1">Bathrooms:</label>
            <input type="number" id="bathrooms" name="bathrooms" value={formData.bathrooms} onChange={handleChange}
                className="shadow-sm appearance-none rounded-full w-full py-2 px-3 bg-input-bg text-text-primary leading-tight focus:outline-none focus:ring-2 focus:ring-primary-accent transition duration-200 font-normal" />
          </div>
        </div>

        {/* Checkbox for Balcony */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="balcony"
            name="balcony"
            checked={formData.balcony}
            onChange={handleChange}
            className="h-4 w-4 text-primary-accent rounded border-border-subtle focus:ring-primary-accent transition duration-200"
          />
          <label htmlFor="balcony" className="ml-2 text-text-secondary text-sm font-medium">Balcony Available</label>
        </div>

        {/* Other details */}
        <div>
          <label htmlFor="minimumStay" className="block text-text-secondary text-sm font-medium mb-1">Minimum Stay (months, optional):</label>
          <input type="number" id="minimumStay" name="minimumStay" value={formData.minimumStay} onChange={handleChange}
              className="shadow-sm appearance-none rounded-full w-full py-2 px-3 bg-input-bg text-text-primary leading-tight focus:outline-none focus:ring-2 focus:ring-primary-accent transition duration-200 font-normal" />
        </div>
        <div>
          <label htmlFor="description" className="block text-text-secondary text-sm font-medium mb-1">Description:</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="shadow-sm rounded-xl w-full py-2 px-3 bg-input-bg text-text-primary leading-tight focus:outline-none focus:ring-2 focus:ring-primary-accent transition duration-200 font-normal"
          ></textarea>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center mt-6">
          <button
            type="submit"
            className="bg-primary-accent hover:bg-accent-hover text-white rounded-3xl font-bold py-3 px-8 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-accent focus:ring-opacity-50 transition duration-200 transform hover:scale-105"
            disabled={loading}
          >
            {loading ? 'Listing Flat...' : 'List Flat Now'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateFlatPage;
