// frontend/src/pages/AllFlatsPage.tsx (REVISED)

import React, { useEffect, useState } from 'react';
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
import { Label } from '@/components/ui/label';
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from '@/components/ui/button';
import {
  HoverCard, // NEW: Import HoverCard components
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

import { Badge } from "@/components/ui/badge"; // For displaying selected amenities count
import { Settings2 } from 'lucide-react'; 


const AllFlatsPage: React.FC = () => {
  const [flats, setFlats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableAmenities, setAvailableAmenities] = useState<any[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<Set<number>>(new Set());
  
  // FIX: Use single state for sorting to match the API signature
  const [sortBy, setSortBy] = useState<string>('monthlyRentalCost'); 
  const [sortOrder, setSortOrder] = useState<string>('low');

  const fetchFlats = async () => {
    try {
      setLoading(true);
      // FIX: Pass sort and filter parameters correctly to the API
      const response = await getAllFlats(sortBy, sortOrder, Array.from(selectedAmenities));
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

  // FIX: Trigger re-fetch when sorting or amenities change
  useEffect(() => {
    fetchFlats();
  }, [sortBy, sortOrder, selectedAmenities]);

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

  if (loading) {
    return <p className="text-muted-foreground text-xl">Loading available flats...</p>;
  }

  return (
    <Card className="p-8 shadow-lg border border-border w-full max-w-5xl text-card-foreground">
      <CardHeader>
        <CardTitle className="text-3xl font-bold mb-4 text-center text-foreground">Available Flats</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-start mb-6">
          {/* Sorting Controls on the Left */}
          <div className="flex gap-4 items-end">
            <div>
              <Label htmlFor="sortBy">Sort By:</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger id="sortBy" className="w-[180px]">
                  <SelectValue placeholder="Select field" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthlyRentalCost">Monthly Rent</SelectItem>
                  <SelectItem value="bedrooms">Bedrooms</SelectItem>
                  <SelectItem value="bathrooms">Bathrooms</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sortOrder">Order:</Label>
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger id="sortOrder" className="w-[180px]">
                  <SelectValue placeholder="Select order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low to High</SelectItem>
                  <SelectItem value="high">High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
           {/* REVISED: Amenity Filter using HoverCard */}
          <div className="flex flex-col items-end gap-2">
            
            <HoverCard>
              <HoverCardTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Settings2 size={16} />
                  Amenities
                  {selectedAmenities.size > 0 && (
                    <Badge className="ml-2">{selectedAmenities.size}</Badge>
                  )}
                </Button>
              </HoverCardTrigger>
              <HoverCardContent className="w-60">
                <div className="flex flex-col gap-2">
                  <h4 className="font-semibold text-center mb-2">Select Amenities</h4>
                  <div className="flex flex-col gap-2">
                    {availableAmenities.map(amenity => (
                      <div key={amenity.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`amenity-filter-${amenity.id}`}
                          checked={selectedAmenities.has(amenity.id)} // <-- FIX: Checkbox's checked state
                          onCheckedChange={() => handleAmenityFilter(amenity.id)}
                        />
                        <Label htmlFor={`amenity-filter-${amenity.id}`} className="text-sm">
                          {amenity.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
          </div>
        </div>

        <FlatList
          flats={flats}
          title=""
          emptyMessage="No flats are currently available. Check back soon!"
        />
      </CardContent>
    </Card>
  );
};

export default AllFlatsPage;