// backend/src/controllers/flatController.ts
import { Request, Response } from 'express';
import prisma from '../db';
import { Prisma } from '@prisma/client';

declare module 'express' {
  interface Request {
    user?: { id: number; userType: string; };
  }
}

// --- Create a new Flat listing (Owner only) ---
export const createFlat = async (req: Request, res: Response) => {
  if (!req.user || req.user.userType !== 'owner') {
    return res.status(403).json({ message: 'Not authorized. Only owners can create flats.' });
  }

  const ownerId = req.user.id;
  const {
    flatNumber, floor, houseName, houseNumber, address, latitude, longitude,
    monthlyRentalCost, utilityCost, bedrooms, bathrooms, minimumStay, description, status,
    amenities
  } = req.body;

  if (!address || !monthlyRentalCost) {
    return res.status(400).json({ message: 'Please provide address and monthly rental cost.' });
  }

  try {
    const newFlat = await prisma.flat.create({
      data: {
        owner: { connect: { id: ownerId } },
        flatNumber,
        floor: floor ? parseInt(floor) : null,
        houseName,
        houseNumber,
        address,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        monthlyRentalCost: parseFloat(monthlyRentalCost),
        utilityCost: utilityCost ? parseFloat(utilityCost) : null,
        bedrooms: bedrooms ? parseInt(bedrooms) : null,
        bathrooms: bathrooms ? parseInt(bathrooms) : null,
        minimumStay: minimumStay ? parseInt(minimumStay) : null,
        description,
        status: status || 'available',
        amenities: {
          create: amenities ? amenities.map((amenity: { id: number }) => ({
            amenityId: amenity.id,
          })) : [],
        },
      },
    });

    res.status(201).json({ message: 'Flat created successfully', flat: newFlat });
  } catch (error) {
    console.error('Error creating flat:', error);
    res.status(500).json({ message: 'Server error during creation.' });
  }
};

// --- Get all Flat listings (Publicly accessible for tenants/visitors) ---
export const getAllFlats = async (req: Request, res: Response) => {
  try {
    const flats = await prisma.flat.findMany({
      where: { status: 'available' },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        images: { select: { id: true, url: true, isThumbnail: true } },
        amenities: { include: { amenity: true } },
      },
    });

    res.status(200).json(flats);
  } catch (error) {
    console.error('Error fetching all flats:', error);
    res.status(500).json({ message: 'Server error fetching flats.' });
  }
};

// --- Get Flats for Authenticated Owner (Owner only) ---
export const getOwnerFlats = async (req: Request, res: Response) => {
  if (!req.user || req.user.userType !== 'owner') {
    return res.status(403).json({ message: 'Not authorized. Only owners can view their flats.' });
  }

  const ownerId = req.user.id;
  try {
    const ownerFlats = await prisma.flat.findMany({
      where: { ownerId: ownerId },
      include: {
        images: { select: { id: true, url: true, isThumbnail: true } },
        amenities: { include: { amenity: true } },
      },
    });

    res.status(200).json(ownerFlats);
  } catch (error) {
    console.error('Error fetching owner flats:', error);
    res.status(500).json({ message: 'Server error fetching owner flats.' });
  }
};

// --- Get Single Flat Details ---
export const getFlatById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const userType = req.user?.userType;
  try {
    const flatAuthCheck = await prisma.flat.findUnique({
      where: { id: parseInt(id) },
      select: { ownerId: true }
    });

    if (!flatAuthCheck) {
      return res.status(404).json({ message: 'Flat not found.' });
    }

    const isOwnerOfFlat = userId && flatAuthCheck.ownerId === userId && userType === 'owner';
    const isAuthenticatedUser = !!userId;

    let queryOptions: Prisma.FlatFindUniqueArgs;

    if (isOwnerOfFlat) {
      queryOptions = {
        where: { id: parseInt(id) },
        include: {
          owner: true,
          images: true,
          amenities: { include: { amenity: true } },
        },
      };
    } else {
      queryOptions = {
        where: { id: parseInt(id) },
        select: {
          id: true,
          houseName: true,
          address: true,
          latitude: true,
          longitude: true,
          monthlyRentalCost: true,
          bedrooms: true,
          bathrooms: true,
          minimumStay: true,
          description: true,
          status: true,
          rating: true,
          createdAt: true,
          updatedAt: true,
          ownerId: true,

          flatNumber: isAuthenticatedUser,
          floor: isAuthenticatedUser,
          houseNumber: isAuthenticatedUser,
          utilityCost: isAuthenticatedUser,

          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: isAuthenticatedUser,
              phone: isOwnerOfFlat ? true : false,
              nid: isOwnerOfFlat ? true : false,
            },
          },

          images: { select: { id: true, url: true, isThumbnail: true } },
          amenities: { select: { amenity: { select: { id: true, name: true, description: true } } } },
        },
      };
    }

    const flatData = await prisma.flat.findUnique(queryOptions);

    if (!flatData) {
      return res.status(404).json({ message: 'Flat details not found after main fetch.' });
    }

    res.status(200).json(flatData);
  } catch (error) {
    console.error('Error fetching flat by ID:', error);
    res.status(500).json({ message: 'Server error fetching flat details.' });
  }
};

// --- Delete a Flat (Owner only) ---
export const deleteFlat = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'Not authenticated.' });
  }

  try {
    const flat = await prisma.flat.findUnique({
      where: { id: parseInt(id) },
      select: { id: true, ownerId: true }
    });

    if (!flat) {
      return res.status(404).json({ message: 'Flat not found.' });
    }

    if (flat.ownerId !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this flat.' });
    }

    await prisma.flat.delete({
      where: { id: parseInt(id) },
    });

    res.status(200).json({ message: 'Flat deleted successfully.' });

  } catch (error) {
    console.error('Error deleting flat:', error);
    res.status(500).json({ message: 'Server error during flat deletion.' });
  }
};


// --- Update a Flat (Owner only) ---
export const updateFlat = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'Not authenticated.' });
  }

  const {
    flatNumber, floor, houseName, houseNumber, address, latitude, longitude,
    monthlyRentalCost, utilityCost, bedrooms, bathrooms,
    minimumStay, description, status,
    amenities // This should be an array of objects with { id: number }
  } = req.body;

  try {
    const flat = await prisma.flat.findUnique({
      where: { id: parseInt(id) },
      select: { id: true, ownerId: true }
    });

    if (!flat) {
      return res.status(404).json({ message: 'Flat not found.' });
    }

    if (flat.ownerId !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this flat.' });
    }

    const updateData: Prisma.FlatUpdateInput = {
      flatNumber: flatNumber !== undefined ? flatNumber : undefined,
      floor: floor !== undefined ? parseInt(floor) : undefined,
      houseName: houseName !== undefined ? houseName : undefined,
      houseNumber: houseNumber !== undefined ? houseNumber : undefined,
      address: address !== undefined ? address : undefined,
      latitude: latitude !== undefined ? parseFloat(latitude) : undefined,
      longitude: longitude !== undefined ? parseFloat(longitude) : undefined,
      monthlyRentalCost: monthlyRentalCost !== undefined ? parseFloat(monthlyRentalCost) : undefined,
      utilityCost: utilityCost !== undefined ? parseFloat(utilityCost) : undefined,
      bedrooms: bedrooms !== undefined ? parseInt(bedrooms) : undefined,
      bathrooms: bathrooms !== undefined ? parseInt(bathrooms) : undefined,
      minimumStay: minimumStay !== undefined ? parseInt(minimumStay) : undefined,
      description: description !== undefined ? description : undefined,
      status: status !== undefined ? status : undefined,
    };

    // --- FIX AMENITY LINKING LOGIC ---
    if (amenities) {
        // First, disconnect all existing amenities from the flat
        await prisma.flatAmenity.deleteMany({
            where: { flatId: flat.id }
        });

        // Then, connect the new set of amenities
        updateData.amenities = {
            create: amenities.map((amenity: { id: number }) => ({
                amenityId: amenity.id
            }))
        };
    }
    // --- END FIX ---

    const updatedFlat = await prisma.flat.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    res.status(200).json({ message: 'Flat updated successfully.', flat: updatedFlat });

  } catch (error) {
    console.error('Error updating flat:', error);
    res.status(500).json({ message: 'Server error during flat update.' });
  }
};

// --- Get All Amenities ---
export const getAllAmenities = async (req: Request, res: Response) => {
  try {
    const amenities = await prisma.amenity.findMany({
      select: {
        id: true,
        name: true,
        description: true,
      }
    });
    res.status(200).json(amenities);
  } catch (error) {
    console.error('Error fetching amenities:', error);
    res.status(500).json({ message: 'Server error fetching amenities.' });
  }
};