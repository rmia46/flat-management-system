// frontend/src/pages/AllFlatsPage.tsx (REVISED)
import React, { useEffect, useState, useRef } from 'react';
import { getAllFlats, getAllAmenities } from '../services/api';
import FlatList from '../components/flats/FlatList';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

import { Input } from '@/components/ui/input';
import { Combobox } from '@/components/ui/combobox';
import { useAuth } from '../context/AuthContext';


const districts = [
  { value: "bagerhat", label: "Bagerhat" }, { value: "bandarban", label: "Bandarban" },
  { value: "barguna", label: "Barguna" }, { value: "barisal", label: "Barisal" },
  { value: "bhola", label: "Bhola" }, { value: "bogra", label: "Bogra" },
  { value: "brahmanbaria", label: "Brahmanbaria" }, { value: "chandpur", label: "Chandpur" },
  { value: "chittagong", label: "Chittagong" }, { value: "chuadanga", label: "Chuadanga" },
  { value: "comilla", label: "Comilla" }, { value: "coxs-bazar", label: "Cox's Bazar" },
  { value: "dhaka", label: "Dhaka" }, { value: "dinajpur", label: "Dinajpur" },
  { value: "faridpur", label: "Faridpur" }, { value: "feni", label: "Feni" },
  { value: "gaibandha", label: "Gaibandha" }, { value: "gazipur", label: "Gazipur" },
  { value: "gopalganj", label: "Gopalganj" }, { value: "habiganj", label: "Habiganj" },
  { value: "jaipurhat", label: "Jaipurhat" }, { value: "jamalpur", label: "Jamalpur" },
  { value: "jessore", label: "Jessore" }, { value: "jhalokati", label: "Jhalokati" },
  { value: "jhenaidah", label: "Jhenaidah" }, { value: "khagrachari", label: "Khagrachari" },
  { value: "khulna", label: "Khulna" }, { value: "kishoreganj", label: "Kishoreganj" },
  { value: "kurigram", label: "Kurigram" }, { value: "kushtia", label: "Kushtia" },
  { value: "lakshmipur", label: "Lakshmipur" }, { value: "lalmonirhat", label: "Lalmonirhat" },
  { value: "madaripur", label: "Madaripur" }, { value: "magura", label: "Magura" },
  { value: "manikganj", label: "Manikganj" }, { value: "meherpur", label: "Meherpur" },
  { value: "moulvibazar", label: "Moulvibazar" }, { value: "munshiganj", label: "Munshiganj" },
  { value: "mymensingh", label: "Mymensingh" }, { value: "naogaon", label: "Naogaon" },
  { value: "narail", label: "Narail" }, { value: "narayanganj", label: "Narayanganj" },
  { value: "narsingdi", label: "Narsingdi" }, { value: "natore", label: "Natore" },
  { value: "nawabganj", label: "Nawabganj" }, { value: "netrakona", label: "Netrakona" },
  { value: "nilphamari", label: "Nilphamari" }, { value: "noakhali", label: "Noakhali" },
  { value: "pabna", label: "Pabna" }, { value: "panchagarh", label: "Panchagarh" },
  { value: "patuakhali", label: "Patuakhali" }, { value: "pirojpur", label: "Pirojpur" },
  { value: "rajbari", label: "Rajbari" }, { value: "rajshahi", label: "Rajshahi" },
  { value: "rangamati", label: "Rangamati" }, { value: "rangpur", label: "Rangpur" },
  { value: "satkhira", label: "Satkhira" }, { value: "shariatpur", label: "Shariatpur" },
  { value: "sherpur", label: "Sherpur" }, { value: "sirajganj", label: "Sirajganj" },
  { value: "sunamganj", label: "Sunamganj" }, { value: "sylhet", label: "Sylhet" },
  { value: "tangail", label: "Tangail" }, { value: "thakurgaon", label: "Thakurgaon" },
];

const AllFlatsPage: React.FC = () => {
  const { user } = useAuth();
  const [flats, setFlats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableAmenities, setAvailableAmenities] = useState<any[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<Set<number>>(new Set());
  
  const [sortBy, setSortBy] = useState('monthlyRentalCost');
  const [sortOrder, setSortOrder] = useState('low');
  
  const [minRent, setMinRent] = useState('');
  const [maxRent, setMaxRent] = useState('');
  const [district, setDistrict] = useState('');
  
  // Debounce for rent inputs
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchFlats = async () => {
    try {
      setLoading(true);
      
      // FIX: Correctly pass parameters to API
      const response = await getAllFlats(
        sortBy, 
        sortOrder, 
        Array.from(selectedAmenities),
        district,
        minRent ? parseFloat(minRent) : undefined,
        maxRent ? parseFloat(maxRent) : undefined
      );
      setFlats(response.data);
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching all flats:', err);
      toast.error('Failed to load flats. Please try again later.');
      setLoading(false);
    }
  };

  const fetchAmenities = async () => {
    try {
      const response = await getAllAmenities();
      setAvailableAmenities(response.data);
    } catch (err) {
      console.error("Failed to fetch amenities:", err);
      toast.error("Failed to fetch amenities.");
    }
  };

  useEffect(() => {
    fetchAmenities();
  }, []);

  // FIX: Re-fetch logic using debounce for rent filters
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      fetchFlats();
    }, 500); // 500ms debounce delay

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [sortBy, sortOrder, selectedAmenities, district, minRent, maxRent]);


  const handleAmenityFilter = (amenityId: number) => {
    setSelectedAmenities(prev => {
      const newSet = new Set(prev);
      if (newSet.has(amenityId)) {
        newSet.delete(amenityId);
      } else {
        newSet.add(amenityId);
      }
      return newSet;
    });
  };

  // FIX: Only show this page for tenants
  if (user?.userType !== 'tenant' && user) {
    return <p className="text-muted-foreground text-xl text-center">You do not have access to this page.</p>;
  }


  if (loading) {
    return (
      <div className="container mx-auto flex flex-col md:flex-row gap-6 p-4">
        <p className="text-muted-foreground text-xl">Loading available flats...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto flex flex-col md:flex-row gap-6 p-4">
      {/* Sidebar for Sorting and Filtering */}
      <Card className="md:w-1/4 p-4 sticky top-4 self-start h-fit shadow-lg border border-border">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Filters & Sorting</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {/* District Filter */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="districtFilter">District:</Label>
            <Combobox
              options={districts}
              value={district}
              onValueChange={setDistrict}
              placeholder="Select District..."
              emptyMessage="No district found."
            />
          </div>

          {/* Rent Range Filter */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="rentRange">Rent Range:</Label>
            <div className="flex items-center gap-2">
              <Input
                id="minRent"
                type="number"
                placeholder="Min"
                value={minRent}
                onChange={(e) => setMinRent(e.target.value)}
              />
              <span>-</span>
              <Input
                id="maxRent"
                type="number"
                placeholder="Max"
                value={maxRent}
                onChange={(e) => setMaxRent(e.target.value)}
              />
            </div>
          </div>
          
          {/* Amenities Filter */}
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium">Amenities:</h3>
            <div className="flex flex-col gap-2">
              {availableAmenities.map(amenity => (
                <div key={amenity.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`amenity-filter-${amenity.id}`}
                    checked={selectedAmenities.has(amenity.id)}
                    onCheckedChange={() => handleAmenityFilter(amenity.id)}
                  />
                  <Label htmlFor={`amenity-filter-${amenity.id}`} className="text-sm">
                    {amenity.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Sorting Options (only for Monthly Rent) */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="sortOrder">Sort by Rent:</Label>
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger id="sortOrder" className="w-full">
                <SelectValue placeholder="Select order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low to High</SelectItem>
                <SelectItem value="high">High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Area for Flats */}
      <div className="md:w-3/4">
        <Card className="p-8 shadow-lg border border-border w-full text-card-foreground">
          <CardHeader>
            <CardTitle className="text-3xl font-bold mb-4 text-center text-foreground">Available Flats</CardTitle>
          </CardHeader>
          <CardContent>
            <FlatList
              flats={flats}
              title=""
              emptyMessage="No flats are currently available. Adjust your filters or check back soon!"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AllFlatsPage;