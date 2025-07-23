// frontend/src/pages/CreateFlatPage.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { createFlat } from '../services/api';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CreateFlatPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    flatNumber: '', floor: '', houseName: '', houseNumber: '', address: '',
    latitude: '', longitude: '', monthlyRentalCost: '', utilityCost: '',
    bedrooms: '', bathrooms: '', balcony: false, minimumStay: '', description: '',
    status: 'available',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else if (user?.userType !== 'owner') {
      navigate('/dashboard');
    }
  }, [isAuthenticated, user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement; // Cast to HTMLInputElement first
    const { name, value } = target;

    // Check if it's a checkbox specifically
    if (target.type === 'checkbox') {
        setFormData({
            ...formData,
            [name]: target.checked, // 'checked' is only on HTMLInputElement for checkboxes
        });
    } else {
        setFormData({
            ...formData,
            [name]: value, // 'value' exists on both input and textarea
        });
    }
  };

  const handleSelectChange = (value: string) => {
    setFormData({ ...formData, status: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccessMessage('');

    if (!user || user.userType !== 'owner') { setError('You must be an owner to list a flat.'); return; }
    if (formData.latitude && isNaN(parseFloat(formData.latitude))) { setError('Latitude must be a valid number.'); return; }
    if (formData.longitude && isNaN(parseFloat(formData.longitude))) { setError('Longitude must be a valid number.'); return; }
    if (!formData.address || !formData.monthlyRentalCost) { setError('Address and Monthly Rent are required fields.'); return; }

    setLoading(true);
    try {
      const dataToSend = {
        ...formData,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        monthlyRentalCost: parseFloat(formData.monthlyRentalCost),
        utilityCost: formData.utilityCost ? parseFloat(formData.utilityCost) : null,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
        floor: formData.floor ? parseInt(formData.floor) : null,
        minimumStay: formData.minimumStay ? parseInt(formData.minimumStay) : null,
      };

      const res = await createFlat(dataToSend);
      setSuccessMessage('Flat listed successfully! Redirecting to dashboard...');
      console.log('Flat creation response:', res.data);
      setTimeout(() => { navigate('/dashboard'); }, 2000);
    } catch (err: any) {
      console.error('Error creating flat:', err.response ? err.response.data : err.message);
      setError(err.response?.data?.message || 'Failed to list flat. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-8 shadow-lg border border-border w-full max-w-2xl text-card-foreground"> 
      <CardHeader className="text-center pb-6">
        <CardTitle className="text-3xl font-bold text-foreground mb-2">List Your Flat</CardTitle> 
        {error && <CardDescription className="text-destructive font-normal">{error}</CardDescription>} 
        {successMessage && <CardDescription className="text-green-500 font-normal">{successMessage}</CardDescription>} 
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label htmlFor="address" className="block text-muted-foreground text-sm font-medium mb-1">Full Address (Street, City, Area, Country):</label>
            <Input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
            />
          </div>

          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                  <label htmlFor="latitude" className="block text-muted-foreground text-sm font-medium mb-1">Latitude (Optional):</label>
                  <Input
                      type="text"
                      id="latitude"
                      name="latitude"
                      value={formData.latitude}
                      onChange={handleChange}
                  />
              </div>
              <div>
                  <label htmlFor="longitude" className="block text-muted-foreground text-sm font-medium mb-1">Longitude (Optional):</label>
                  <Input
                      type="text"
                      id="longitude"
                      name="longitude"
                      value={formData.longitude}
                      onChange={handleChange}
                  />
              </div>
          </div>

          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="flatNumber" className="block text-muted-foreground text-sm font-medium mb-1">Flat Number:</label>
              <Input type="text" id="flatNumber" name="flatNumber" value={formData.flatNumber} onChange={handleChange} />
            </div>
            <div>
              <label htmlFor="floor" className="block text-muted-foreground text-sm font-medium mb-1">Floor:</label>
              <Input type="number" id="floor" name="floor" value={formData.floor} onChange={handleChange} />
            </div>
            <div>
              <label htmlFor="houseName" className="block text-muted-foreground text-sm font-medium mb-1">House Name:</label>
              <Input type="text" id="houseName" name="houseName" value={formData.houseName} onChange={handleChange} />
            </div>
            <div>
              <label htmlFor="houseNumber" className="block text-muted-foreground text-sm font-medium mb-1">House Number:</label>
              <Input type="text" id="houseNumber" name="houseNumber" value={formData.houseNumber} onChange={handleChange} />
            </div>
            <div>
              <label htmlFor="monthlyRentalCost" className="block text-muted-foreground text-sm font-medium mb-1">Monthly Rent (BDT):</label>
              <Input type="number" id="monthlyRentalCost" name="monthlyRentalCost" value={formData.monthlyRentalCost} onChange={handleChange} required />
            </div>
            <div>
              <label htmlFor="utilityCost" className="block text-muted-foreground text-sm font-medium mb-1">Utility Cost (BDT, optional):</label>
              <Input type="number" id="utilityCost" name="utilityCost" value={formData.utilityCost} onChange={handleChange} />
            </div>
            <div>
              <label htmlFor="bedrooms" className="block text-muted-foreground text-sm font-medium mb-1">Bedrooms:</label>
              <Input type="number" id="bedrooms" name="bedrooms" value={formData.bedrooms} onChange={handleChange} />
            </div>
            <div>
              <label htmlFor="bathrooms" className="block text-muted-foreground text-sm font-medium mb-1">Bathrooms:</label>
              <Input type="number" id="bathrooms" name="bathrooms" value={formData.bathrooms} onChange={handleChange} />
            </div>
          </div>

          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="balcony"
              name="balcony"
              checked={formData.balcony}
              onChange={handleChange}
              className="h-4 w-4 rounded-sm border border-input bg-background text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" // Adjusted checkbox styles
            />
            <label htmlFor="balcony" className="ml-2 text-muted-foreground text-sm font-medium">Balcony Available</label>
          </div>

          
          <div>
            <label htmlFor="minimumStay" className="block text-muted-foreground text-sm font-medium mb-1">Minimum Stay (months, optional):</label>
            <Input type="number" id="minimumStay" name="minimumStay" value={formData.minimumStay} onChange={handleChange} />
          </div>
          <div>
            <label htmlFor="description" className="block text-muted-foreground text-sm font-medium mb-1">Description:</label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
            ></Textarea>
          </div>

          
          <div className="flex justify-center mt-6">
            <Button type="submit" disabled={loading}>
              {loading ? 'Listing Flat...' : 'List Flat Now'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateFlatPage;
