// backend/src/controllers/flatController.ts (COMPLETE FILE)
import { Request, Response } from 'express';
import prisma from '../db';

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
