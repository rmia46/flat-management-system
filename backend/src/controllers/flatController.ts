// backend/src/controllers/flatController.ts
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
    flatNumber, floor, houseName, houseNumber, address, latitude, longitude,
    monthlyRentalCost, utilityCost, bedrooms, bathrooms, balcony,
    minimumStay, description, status // status should generally be 'available' initially
  } = req.body;

  // Basic validation (add more robust validation later)
  if (!address || !latitude || !longitude || !monthlyRentalCost) {
    return res.status(400).json({ message: 'Please provide address, coordinates, and monthly rental cost.' });
  }

  try {
    const newFlat = await prisma.flat.create({
      data: {
        ownerId,
        flatNumber,
        floor,
        houseName,
        houseNumber,
        address,
        latitude,
        longitude,
        monthlyRentalCost,
        utilityCost,
        bedrooms,
        bathrooms,
        balcony,
        minimumStay,
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
    res.status(500).json({ message: 'Server error during flat creation.' });
  }
};

// --- Get all Flat listings (Publicly accessible) ---
export const getAllFlats = async (req: Request, res: Response) => {
  try {
    const flats = await prisma.flat.findMany({
      where: {
        status: 'available', // Only show available flats by default
        // You can add more filtering based on query parameters later (e.g., city, min_rent, max_rent)
      },
      include: {
        owner: { // Include owner details (e.g., name, contact)
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        images: { // Include associated images
          select: {
            id: true,
            url: true,
            isThumbnail: true,
          },
        },
        amenities: { // Include associated amenities
          include: {
            amenity: true,
          },
        },
      },
    });

    res.status(200).json(flats);
  } catch (error) {
    console.error('Error fetching flats:', error);
    res.status(500).json({ message: 'Server error fetching flats.' });
  }
};

// Future: getFlatById, updateFlat, deleteFlat, etc.
