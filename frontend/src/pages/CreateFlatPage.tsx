// frontend/src/pages/CreateFlatPage.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { createFlat, getFlatById, updateFlat } from '../services/api';

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
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

const CreateFlatPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { id: flatId } = useParams<{ id: string }>();
  const isEditMode = !!flatId;

  const [formData, setFormData] = useState({
    flatNumber: '', floor: '', houseName: '', houseNumber: '', address: '',
    latitude: '', longitude: '', monthlyRentalCost: '', utilityCost: '',
    bedrooms: '', bathrooms: '', balcony: false, minimumStay: '', description: '',
    status: 'available',
  });

  const [loading, setLoading] = useState(false); // For API call and brief post-success delay
  // REMOVED: const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [initialLoading, setInitialLoading] = useState(isEditMode);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user?.userType !== 'owner') {
      navigate('/dashboard');
      return;
    }

    if (isEditMode && flatId) {
      const fetchFlatData = async () => {
        setInitialLoading(true);
        try {
          const res = await getFlatById(parseInt(flatId));
          const flatData = res.data;

          setFormData({
            flatNumber: flatData.flatNumber || '',
            floor: flatData.floor || '',
            houseName: flatData.houseName || '',
            houseNumber: flatData.houseNumber || '',
            address: flatData.address || '',
            latitude: flatData.latitude !== null ? String(flatData.latitude) : '',
            longitude: flatData.longitude !== null ? String(flatData.longitude) : '',
            monthlyRentalCost: flatData.monthlyRentalCost !== null ? String(flatData.monthlyRentalCost) : '',
            utilityCost: flatData.utilityCost !== null ? String(flatData.utilityCost) : '',
            bedrooms: flatData.bedrooms !== null ? String(flatData.bedrooms) : '',
            bathrooms: flatData.bathrooms !== null ? String(flatData.bathrooms) : '',
            balcony: flatData.balcony || false,
            minimumStay: flatData.minimumStay !== null ? String(flatData.minimumStay) : '',
            description: flatData.description || '',
            status: flatData.status || 'available',
          });
        } catch (err) {
          console.error("Failed to fetch flat data for editing:", err);
          setError("Failed to load flat data for editing.");
        } finally {
          setInitialLoading(false);
        }
      };
      fetchFlatData();
    } else {
      setInitialLoading(false);
    }
  }, [isAuthenticated, user, navigate, isEditMode, flatId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement;
    const { name, value } = target;

    if (target.type === 'checkbox') {
        setFormData({
            ...formData,
            [name]: target.checked,
        });
    } else {
        setFormData({
            ...formData,
            [name]: value,
        });
    }
  };

  const handleSelectChange = (value: string) => {
    setFormData({ ...formData, status: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccessMessage('');

    if (!user || user.userType !== 'owner') { setError('You must be an owner to list/edit a flat.'); return; }
    if (formData.latitude && isNaN(parseFloat(formData.latitude))) { setError('Latitude must be a valid number.'); return; }
    if (formData.longitude && isNaN(parseFloat(formData.longitude))) { setError('Longitude must be a valid number.'); return; }
    if (!formData.address || !formData.monthlyRentalCost) { setError('Full Address and Monthly Rent are required fields.'); return; }

    setLoading(true); // Start API call loading indicator
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

      let res;
      if (isEditMode && flatId) {
        res = await updateFlat(parseInt(flatId), dataToSend);
        setSuccessMessage('Flat updated successfully!');
      } else {
        res = await createFlat(dataToSend);
        setSuccessMessage('Flat listed successfully!');
      }

      console.log('Flat operation response:', res.data);

      // REDIRECTION LOGIC: Show success, then redirect after delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500); // 1.5 seconds delay to show success message and for user to register it

    } catch (err: any) {
      console.error('Error during flat operation:', err.response ? err.response.data : err.message);
      setError(err.response?.data?.message || 'Failed to complete flat operation. Please try again.');
      setLoading(false); // Ensure loading is false on error
    } finally {
      // No need to set isRedirecting here, loading will manage button state
      // The timeout handles the actual navigation.
    }
  };

  if (initialLoading) {
    return (
      <Card className="p-8 shadow-lg border border-border w-full max-w-2xl text-card-foreground text-center">
        <CardContent><p className="text-xl">Loading flat for editing...</p></CardContent>
      </Card>
    );
  }

  return (
    <Card className="p-8 shadow-lg border border-border w-full max-w-2xl text-card-foreground">
      {/* REMOVED: Loading Overlay */}
      {/* {(loading || isRedirecting) && ( ... )} */}

      <CardHeader className="text-center pb-6">
        <CardTitle className="text-3xl font-bold text-foreground mb-2">
          {isEditMode ? 'Edit Flat Listing' : 'List Your Flat'}
        </CardTitle>
        {error && <CardDescription className="text-destructive font-normal">{error}</CardDescription>}
        {successMessage && <CardDescription className="text-green-500 font-normal">{successMessage}</CardDescription>}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* All form fields are the same as before */}
          <div>
            <label htmlFor="address" className="block text-muted-foreground text-sm font-medium mb-1">Full Address (Street, City, Area, Country):</label>
            <Input
              type="text" id="address" name="address" value={formData.address} onChange={handleChange}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                  <label htmlFor="latitude" className="block text-muted-foreground text-sm font-medium mb-1">Latitude (Optional):</label>
                  <Input type="text" id="latitude" name="latitude" value={formData.latitude} onChange={handleChange} />
              </div>
              <div>
                  <label htmlFor="longitude" className="block text-muted-foreground text-sm font-medium mb-1">Longitude (Optional):</label>
                  <Input type="text" id="longitude" name="longitude" value={formData.longitude} onChange={handleChange} />
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

          {/* Checkbox for Balcony */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="balcony"
              name="balcony"
              checked={formData.balcony}
              onChange={handleChange}
              className="h-4 w-4 rounded-sm border border-input bg-background text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <label htmlFor="balcony" className="ml-2 text-muted-foreground text-sm font-medium">Balcony Available</label>
          </div>

          {/* Other details */}
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

          {/* Status Select (only visible in Edit Mode, and for Owners) */}
          {isEditMode && user?.userType === 'owner' && (
            <div>
              <label htmlFor="status" className="block text-muted-foreground text-sm font-medium mb-1">Flat Status:</label>
              <Select value={formData.status} onValueChange={handleSelectChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="booked">Booked</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="unavailable">Unavailable</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-center mt-6">
            <Button type="submit" disabled={loading}> {/* Disable only during API call */}
              {loading ? (
                <>
                  <LoadingSpinner className="mr-2" size={16} /> {/* Spinner next to text */}
                  {isEditMode ? 'Updating...' : 'Listing...'}
                </>
              ) : (
                isEditMode ? 'Update Flat' : 'List Flat Now'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateFlatPage;