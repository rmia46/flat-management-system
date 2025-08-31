// backend/src/services/amenityService.ts
import prisma from '../db';

export const getAllAmenities = async () => {
    const amenities = await prisma.amenity.findMany({
        select: {
            id: true,
            name: true,
            description: true,
        }
    });
    return amenities;
};
