// frontend/src/pages/AllFlatsPage.tsx
import React, { useEffect, useState, useRef } from 'react';
import { getAllFlats, getAllAmenities } from '../services/api';
import FlatList from '../components/flats/FlatList';
import FlatCardSkeleton from '../components/flats/FlatCardSkeleton';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Combobox } from '@/components/ui/combobox';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

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
    const [flats, setFlats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [availableAmenities, setAvailableAmenities] = useState<any[]>([]);
    const [selectedAmenities, setSelectedAmenities] = useState<Set<number>>(new Set());
    const [sortBy, setSortBy] = useState('monthlyRentalCost');
    const [sortOrder, setSortOrder] = useState('low');
    const [minRent, setMinRent] = useState('');
    const [maxRent, setMaxRent] = useState('');
    const [district, setDistrict] = useState('');
    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const fetchFlats = async () => {
        setLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 500)); 
            const response = await getAllFlats(sortBy, sortOrder, Array.from(selectedAmenities), district, minRent ? parseFloat(minRent) : undefined, maxRent ? parseFloat(maxRent) : undefined);
            setFlats(response.data.data.flats);
        } catch (err: any) {
            toast.error(err.message || 'Failed to load flats. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchAmenities = async () => {
            try {
                const response = await getAllAmenities();
                setAvailableAmenities(response.data.data.amenities);
            } catch (err: any) {
                toast.error(err.message || "Failed to fetch amenities.");
            }
        };
        fetchAmenities();
    }, []);

    useEffect(() => {
        if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = setTimeout(() => {
            fetchFlats();
        }, 500);
        return () => {
            if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
        };
    }, [sortBy, sortOrder, selectedAmenities, district, minRent, maxRent]);

    const handleAmenityFilter = (amenityId: number) => {
        setSelectedAmenities(prev => {
            const newSet = new Set(prev);
            if (newSet.has(amenityId)) newSet.delete(amenityId);
            else newSet.add(amenityId);
            return newSet;
        });
    };
    
    const renderSelectedAmenities = () => (
        selectedAmenities.size > 0 && (
            <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-2">Active Filters:</h4>
                <div className="flex flex-wrap gap-2">
                    {availableAmenities
                        .filter(amenity => selectedAmenities.has(amenity.id))
                        .map(amenity => (
                            <Badge key={amenity.id} variant="secondary" className="pl-3 pr-1 py-1 text-sm">
                                {amenity.name}
                                <button onClick={() => handleAmenityFilter(amenity.id)} className="ml-2 rounded-full hover:bg-muted-foreground/20 p-0.5">
                                    <X size={14} />
                                </button>
                            </Badge>
                        ))
                    }
                </div>
            </div>
        )
    );

    return (
        <div className="container mx-auto flex flex-col md:flex-row gap-6 p-4">
            <Card className="md:w-1/4 lg:w-1/5 shadow-lg border border-border h-fit self-start md:sticky md:top-20">
                <CardHeader> <CardTitle className="text-xl font-bold">Filters & Sorting</CardTitle> </CardHeader>
                <CardContent className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2"> <Label>District</Label> <Combobox options={districts} value={district} onValueChange={setDistrict} placeholder="Select District..." /> </div>
                    <div className="flex flex-col gap-2"> <Label>Rent Range</Label> <div className="flex items-center gap-2"> <Input id="minRent" type="number" placeholder="Min" value={minRent} onChange={(e) => setMinRent(e.target.value)} /> <span>-</span> <Input id="maxRent" type="number" placeholder="Max" value={maxRent} onChange={(e) => setMaxRent(e.target.value)} /> </div> </div>
                    <div className="flex flex-col gap-2"> <Label>Sort by Rent</Label> <Select value={sortOrder} onValueChange={setSortOrder}> <SelectTrigger><SelectValue placeholder="Select order" /></SelectTrigger> <SelectContent> <SelectItem value="low">Low to High</SelectItem> <SelectItem value="high">High to Low</SelectItem> </SelectContent> </Select> </div>
                    <div className="flex flex-col gap-2"> <Label>Amenities</Label> <div className="flex flex-col gap-2"> {availableAmenities.map(amenity => ( <div key={amenity.id} className="flex items-center space-x-2"> <Checkbox id={`amenity-filter-${amenity.id}`} checked={selectedAmenities.has(amenity.id)} onCheckedChange={() => handleAmenityFilter(amenity.id)} /> <Label htmlFor={`amenity-filter-${amenity.id}`} className="text-sm font-normal">{amenity.name}</Label> </div> ))} </div> </div>
                    {renderSelectedAmenities()}
                </CardContent>
            </Card>

            <div className="md:w-3/4 lg:w-4/5">
                <Card className="w-full shadow-lg border border-primary/20">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold text-foreground">Available Flats</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {Array(6).fill(0).map((_, index) => (
                                    <FlatCardSkeleton key={index} />
                                ))}
                            </div>
                        ) : (
                            <FlatList
                                flats={flats}
                                title=""
                                emptyMessage="No flats match your criteria. Try adjusting your filters."
                            />
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AllFlatsPage;