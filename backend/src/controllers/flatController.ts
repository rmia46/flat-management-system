// backend/src/controllers/flatController.ts (COMPLETE FILE)
import { Request, Response } from 'express';
import prisma from '../db';
import { Prisma } from '@prisma/client';

declare module 'express' {
  interface Request {
    user?: { id: number; userType: string; }; // Ensure this declaration is available (it should be global already)
  }
}

// --- Create a new Flat listing (Owner only) ---
export const createFlat = async (req: Request, res: Response) => {
  // Ensure the user is an owner, as protected by auth/authorize middleware
  if (!req.user || req.user.userType !== 'owner') {
    return res.status(403).json({ message: 'Not authorized. Only owners can create flats.' });
  }

  const ownerId = req.user.id; // Get owner ID from the authenticated user
  const {
    flatNumber, floor, houseName, houseNumber, address, latitude, longitude, // Added houseNumber
    monthlyRentalCost, utilityCost, bedrooms, bathrooms, balcony,
    minimumStay, description, status
  } = req.body;

  // Basic validation (add more robust validation later)
  if (!address || !monthlyRentalCost) { // Coords are now optional inputs, so not required here
    return res.status(400).json({ message: 'Please provide address and monthly rental cost.' });
  }

  try {
    const newFlat = await prisma.flat.create({
      data: {
        // --- IMPORTANT FIX HERE: Use 'connect' for the owner relation ---
        owner: {
          connect: { id: ownerId }
        },
        flatNumber,
        // Ensure floor is parsed as int or null
        floor: floor ? parseInt(floor) : null,
        houseName,
        houseNumber, // Pass houseNumber from frontend
        address,
        // Ensure latitude/longitude are parsed as float or null
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        // Ensure monthlyRentalCost is parsed as float
        monthlyRentalCost: parseFloat(monthlyRentalCost),
        // Ensure utilityCost, bedrooms, bathrooms, minimumStay are parsed as numbers or null
        utilityCost: utilityCost ? parseFloat(utilityCost) : null,
        bedrooms: bedrooms ? parseInt(bedrooms) : null,
        bathrooms: bathrooms ? parseInt(bathrooms) : null,
        balcony: balcony || false, // Default to false if not provided
        minimumStay: minimumStay ? parseInt(minimumStay) : null,
        description,
        status: status || 'available', // Default to available
      },
    });

    res.status(201).json({
      message: 'Flat created successfully',
      flat: newFlat,
    });
  } catch (error) {
    console.error('Error creating flat:', error);
    // Log the full error object for detailed debugging in development
    // console.error('Prisma error details:', JSON.stringify(error, null, 2));
    res.status(500).json({ message: 'Server error during flat creation.' });
  }
};

// --- Get all Flat listings (Publicly accessible for tenants/visitors) ---
export const getAllFlats = async (req: Request, res: Response) => {
  try {
    const flats = await prisma.flat.findMany({
      where: {
        status: 'available', // Only show available flats by default
      },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        images: {
          select: {
            id: true,
            url: true,
            isThumbnail: true,
          },
        },
        amenities: {
          include: {
            amenity: true,
          },
        },
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
      where: {
        ownerId: ownerId,
      },
      include: {
        images: {
          select: {
            id: true,
            url: true,
            isThumbnail: true,
          },
        },
        amenities: {
          include: {
            amenity: true,
          },
        },
      },
    });

    res.status(200).json(ownerFlats);
  } catch (error) {
    console.error('Error fetching owner flats:', error);
    res.status(500).json({ message: 'Server error fetching owner flats.' });
  }
};

export const getFlatById = async (req: Request, res: Response) => {

  // --- ADD THIS LOG IMMEDIATELY AT THE TOP ---
  console.log('--- START getFlatById Controller ---');
  console.log('req.user state upon entering controller:', req.user);
  // --- END ADDITION ---
  const { id } = req.params;
  const userId = req.user?.id;
  const userType = req.user?.userType;

  console.log('--- getFlatById Debugging ---');
  console.log(`Requested Flat ID: ${id}`);
  console.log(`Authenticated User ID (from req.user): ${userId}, Type: ${userType}`);


  try {
    // 1. Determine Authorization State
    const flatAuthCheck = await prisma.flat.findUnique({
      where: { id: parseInt(id) },
      select: { ownerId: true }
    });

    if (!flatAuthCheck) {
      console.log(`Flat ${id} not found for initial auth check.`);
      return res.status(404).json({ message: 'Flat not found.' });
    }

    const isOwnerOfFlat = userId && flatAuthCheck.ownerId === userId && userType === 'owner';
    const isAuthenticatedUser = !!userId;

    console.log(`Is Owner of This Flat: ${isOwnerOfFlat}`);
    console.log(`Is Any User Authenticated: ${isAuthenticatedUser}`);

    // --- Dynamically Construct the Entire Query Argument Object ---
    let queryOptions: Prisma.FlatFindUniqueArgs; // Use Prisma's generated type for Flat findUnique args

    if (isOwnerOfFlat) {
      // Scenario 1: User is the owner of this specific flat
      // We use 'include' to fetch all details and related data.
      queryOptions = {
        where: { id: parseInt(id) },
        include: {
          owner: true, // Get all owner details
          images: true, // Get all image details
          amenities: { include: { amenity: true } }, // Get all amenity details
        },
      };
      console.log('Querying as OWNER (using include: true for all relations)');

    } else {
      // Scenarios 2 & 3: Authenticated Tenant OR Unauthenticated Visitor
      // We use 'select' to explicitly pick fields and relations, conditionally.
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
          balcony: true,
          minimumStay: true,
          description: true,
          status: true,
          rating: true,
          createdAt: true,
          updatedAt: true,
          ownerId: true,

          // Sensitive Flat Fields: Show if ANY user is authenticated (tenant or owner)
          flatNumber: isAuthenticatedUser,
          floor: isAuthenticatedUser,
          houseNumber: isAuthenticatedUser,
          utilityCost: isAuthenticatedUser,

          // Owner details:
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              // Email: show if authenticated, else false
              email: isAuthenticatedUser,
              // Phone and NID: always false if not the owner of this flat (handled by 'isOwnerOfFlat' path)
              phone: false,
              nid: false,
            },
          },

          // Images and Amenities are generally public
          images: {
            select: { id: true, url: true, isThumbnail: true },
          },
          amenities: {
            select: { amenity: { select: { id: true, name: true, description: true } } },
          },
        },
      };
      console.log(`Querying as ${isAuthenticatedUser ? 'AUTHENTICATED TENANT/OTHER USER' : 'UNAUTHENTICATED VISITOR'} (using dynamic select)`);
    }

    // --- Execute the Query ---
    const flatData = await prisma.flat.findUnique(queryOptions); // Pass the fully constructed object

    if (!flatData) {
      console.log(`Flat ${id} not found after main fetch (should not happen).`);
      return res.status(404).json({ message: 'Flat details not found after main fetch.' });
    }

    console.log('--- Final Flat Data (sent to frontend) ---');
    console.log(JSON.stringify(flatData, (key, value) => {
        if (typeof value === 'object' && value !== null && 'buffer' in value && value.buffer instanceof Buffer) {
            return '[Buffer]';
        }
        return value;
    }, 2));
    console.log('--- End getFlatById Debugging ---');


    res.status(200).json(flatData);

  } catch (error) {
    console.error('Error fetching flat by ID:', error);
    res.status(500).json({ message: 'Server error fetching flat details.' });
  }
};

// --- Delete a Flat (Owner only) ---
export const deleteFlat = async (req: Request, res: Response) => {
  const { id } = req.params; // Flat ID from URL parameter
  const userId = req.user?.id; // Authenticated user ID

  if (!userId) {
    return res.status(401).json({ message: 'Not authenticated.' });
  }

  try {
    const flat = await prisma.flat.findUnique({
      where: { id: parseInt(id) },
      select: { ownerId: true } // Only select ownerId to check authorization
    });

    if (!flat) {
      return res.status(404).json({ message: 'Flat not found.' });
    }

    // Ensure the authenticated user is the owner of this flat
    if (flat.ownerId !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this flat.' });
    }

    // Delete the flat (Prisma will handle cascading deletes if configured in schema.prisma)
    await prisma.flat.delete({
      where: { id: parseInt(id) },
    });

    res.status(200).json({ message: 'Flat deleted successfully.' });

  } catch (error) {
    console.error('Error deleting flat:', error);
    res.status(500).json({ message: 'Server error during flat deletion.' });
  }
};