// frontend/src/pages/CreateFlatPage.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { createFlat, getFlatById, updateFlat, getAllAmenities } from '../services/api';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
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
import { toast } from 'sonner';
import { X, MapPin, BedDouble, DollarSign, Info, FileImage, ThumbsUp } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface Amenity {
  id: number;
  name: string;
  description: string | null;
}

const SectionHeader = ({ icon, title, subtitle }: { icon: React.ElementType, title: string, subtitle: string }) => {
  const Icon = icon;
  return (
    <div className="flex items-center gap-4 py-4">
      <div className="bg-primary/10 p-3 rounded-lg">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
};


const CreateFlatPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { id: flatId } = useParams<{ id: string }>();
  const isEditMode = !!flatId;

  const [formData, setFormData] = useState({
    flatNumber: '', floor: '', houseName: '', houseNumber: '', address: '',
    district: '',
    latitude: '', longitude: '', monthlyRentalCost: '', utilityCost: '',
    bedrooms: '', bathrooms: '', minimumStay: '', description: '',
    status: 'available',
  });
  const [selectedAmenities, setSelectedAmenities] = useState<number[]>([]);
  const [availableAmenities, setAvailableAmenities] = useState<Amenity[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);

  useEffect(() => {
    if (!isAuthenticated || user?.userType !== 'owner') {
      navigate(isAuthenticated ? '/dashboard' : '/login');
      return;
    }

    const fetchInitialData = async () => {
      try {
        const amenityRes = await getAllAmenities();
        setAvailableAmenities(amenityRes.data.data.amenities);

        if (isEditMode && flatId) {
          setInitialLoading(true);
          const flatRes = await getFlatById(parseInt(flatId));
          const flatData = flatRes.data.flat;
          setFormData({
            flatNumber: flatData.flatNumber || '', floor: String(flatData.floor || ''),
            houseName: flatData.houseName || '', houseNumber: flatData.houseNumber || '',
            address: flatData.address || '', district: flatData.district || '',
            latitude: String(flatData.latitude ?? ''), longitude: String(flatData.longitude ?? ''),
            monthlyRentalCost: String(flatData.monthlyRentalCost ?? ''), utilityCost: String(flatData.utilityCost ?? ''),
            bedrooms: String(flatData.bedrooms ?? ''), bathrooms: String(flatData.bathrooms ?? ''),
            minimumStay: String(flatData.minimumStay ?? ''), description: flatData.description || '',
            status: flatData.status || 'available',
          });
          if (flatData.amenities) {
            setSelectedAmenities(flatData.amenities.map((a: any) => a.amenity.id));
          }
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to load initial data.");
      } finally {
        setInitialLoading(false);
      }
    };
    fetchInitialData();
  }, [isAuthenticated, user, navigate, isEditMode, flatId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    if (type === 'number' && parseFloat(value) < 0) {
      setFormData({ ...formData, [name]: '0' });
      return;
    }
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setImageFiles(prevFiles => [...prevFiles, ...files]);
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImageFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
  };

  const handleAmenityChange = (amenityId: number) => {
    setSelectedAmenities(prev =>
      prev.includes(amenityId) ? prev.filter(id => id !== amenityId) : [...prev, amenityId]
    );
  };

  const handleSelectChange = (value: string) => {
    setFormData({ ...formData, status: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || user.userType !== 'owner') {
      toast.error('You must be an owner to list/edit a flat.');
      return;
    }
    if (imageFiles.length === 0 && !isEditMode) {
      toast.error('Please upload at least one image.');
      return;
    }

    setLoading(true);
    const dataToSend = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        dataToSend.append(key, String(value));
      }
    });
    dataToSend.append('amenities', JSON.stringify(selectedAmenities.map(id => ({ id }))));
    
    imageFiles.forEach(file => {
      dataToSend.append('images', file);
    });

    try {
      if (isEditMode && flatId) {
        await updateFlat(parseInt(flatId), dataToSend);
        toast.success('Flat updated successfully!');
      } else {
        await createFlat(dataToSend);
        toast.success('Flat listed successfully!');
      }
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Failed to complete flat operation.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <Card className="p-8 text-center"><CardContent><p>Loading flat data...</p></CardContent></Card>;
  }

  return (
    <Card className="p-4 sm:p-8 shadow-lg border w-full max-w-4xl">
      <CardHeader className="text-center pb-6">
        <CardTitle className="text-3xl font-bold">{isEditMode ? 'Edit Your Flat Listing' : 'List a New Flat'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className="space-y-4">
            <SectionHeader icon={FileImage} title="Property Images" subtitle="Upload clear photos of your flat. The first image will be the thumbnail." />
            <Label htmlFor="images" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/80 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg className="w-8 h-8 mb-4 text-muted-foreground" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/></svg>
                <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
              </div>
            </Label>
            <Input id="images" type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
            {imageFiles.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 border p-2 rounded-md">
                {imageFiles.map((file, index) => (
                  <div key={index} className="relative group"><img src={URL.createObjectURL(file)} alt={`Preview ${index + 1}`} className="w-full h-24 object-cover rounded-md" onLoad={() => URL.revokeObjectURL(file.name)} /><button type="button" onClick={() => removeImage(index)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><X size={14} /></button>{index === 0 && (<div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center py-0.5 rounded-b-md">Thumbnail</div>)}</div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4 border-t pt-6">
            <SectionHeader icon={MapPin} title="Location Details" subtitle="Provide the full address and location of the property." />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label htmlFor="address" className="mb-2 block">Full Address</Label><Input type="text" id="address" name="address" value={formData.address} onChange={handleChange} required /></div>
              <div><Label htmlFor="district" className="mb-2 block">District</Label><Input type="text" id="district" name="district" value={formData.district} onChange={handleChange} required /></div>
              <div><Label htmlFor="latitude" className="mb-2 block">Latitude (Optional)</Label><Input type="text" id="latitude" name="latitude" value={formData.latitude} onChange={handleChange} /></div>
              <div><Label htmlFor="longitude" className="mb-2 block">Longitude (Optional)</Label><Input type="text" id="longitude" name="longitude" value={formData.longitude} onChange={handleChange} /></div>
            </div>
          </div>

          <div className="space-y-4 border-t pt-6">
            <SectionHeader icon={BedDouble} title="Property Specifics" subtitle="Details about the flat's layout and structure." />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div><Label htmlFor="houseName" className="mb-2 block">House Name</Label><Input type="text" id="houseName" name="houseName" value={formData.houseName} onChange={handleChange} /></div>
              <div><Label htmlFor="houseNumber" className="mb-2 block">House Number</Label><Input type="text" id="houseNumber" name="houseNumber" value={formData.houseNumber} onChange={handleChange} /></div>
              <div><Label htmlFor="flatNumber" className="mb-2 block">Flat Number</Label><Input type="text" id="flatNumber" name="flatNumber" value={formData.flatNumber} onChange={handleChange} /></div>
              <div><Label htmlFor="floor" className="mb-2 block">Floor</Label><Input type="number" min="0" id="floor" name="floor" value={formData.floor} onChange={handleChange} /></div>
              <div><Label htmlFor="bedrooms" className="mb-2 block">Bedrooms</Label><Input type="number" min="0" id="bedrooms" name="bedrooms" value={formData.bedrooms} onChange={handleChange} /></div>
              <div><Label htmlFor="bathrooms" className="mb-2 block">Bathrooms</Label><Input type="number" min="0" id="bathrooms" name="bathrooms" value={formData.bathrooms} onChange={handleChange} /></div>
            </div>
          </div>

          <div className="space-y-4 border-t pt-6">
            <SectionHeader icon={DollarSign} title="Pricing & Terms" subtitle="Set the rental costs and minimum stay requirements." />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><Label htmlFor="monthlyRentalCost" className="mb-2 block">Monthly Rent (BDT)</Label><Input type="number" min="0" id="monthlyRentalCost" name="monthlyRentalCost" value={formData.monthlyRentalCost} onChange={handleChange} required /></div>
              <div><Label htmlFor="utilityCost" className="mb-2 block">Utility Cost (Optional)</Label><Input type="number" min="0" id="utilityCost" name="utilityCost" value={formData.utilityCost} onChange={handleChange} /></div>
              <div><Label htmlFor="minimumStay" className="mb-2 block">Minimum Stay (Months)</Label><Input type="number" min="0" id="minimumStay" name="minimumStay" value={formData.minimumStay} onChange={handleChange} /></div>
            </div>
          </div>
          
          <div className="space-y-4 border-t pt-6">
            <SectionHeader icon={ThumbsUp} title="Features & Amenities" subtitle="Select the amenities available and add a detailed description." />
            <div>
              <Label className="mb-2 block">Amenities</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-4 border rounded-md">
                {availableAmenities.map(amenity => (
                  <div key={amenity.id} className="flex items-center space-x-2">
                    <input type="checkbox" id={`amenity-${amenity.id}`} checked={selectedAmenities.includes(amenity.id)} onChange={() => handleAmenityChange(amenity.id)} className="h-4 w-4 rounded-sm border-input bg-background text-primary focus:ring-2 focus:ring-ring" />
                    <Label htmlFor={`amenity-${amenity.id}`} className="font-normal">{amenity.name}</Label>
                  </div>
                ))}
              </div>
            </div>
             <div><Label htmlFor="description" className="mb-2 block">Description</Label><Textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={4}></Textarea></div>
          </div>
          
          {isEditMode && (
            <div className="space-y-4 border-t pt-6">
              <SectionHeader icon={Info} title="Listing Status" subtitle="Set the current availability of your flat." />
              <Select value={formData.status} onValueChange={handleSelectChange}>
                <SelectTrigger className="md:max-w-sm"><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="booked">Booked</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="unavailable">Unavailable</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-center pt-6 border-t">
            <Button size="lg" type="submit" disabled={loading}>
              {loading ? <LoadingSpinner className="mr-2" size={16} /> : (isEditMode ? 'Update Flat Listing' : 'List My Flat')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateFlatPage;