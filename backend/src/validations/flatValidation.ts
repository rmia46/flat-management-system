// backend/src/validations/flatValidation.ts
import { z } from 'zod';

export const createFlatSchema = z.object({
  flatNumber: z.string().optional(),
  floor: z.string().optional(),
  houseName: z.string().optional(),
  houseNumber: z.string().optional(),
  address: z.string().min(1, 'Address is required'),
  district: z.string().min(1, 'District is required'),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  monthlyRentalCost: z.string().min(1, 'Monthly rental cost is required'),
  utilityCost: z.string().optional(),
  bedrooms: z.string().optional(),
  bathrooms: z.string().optional(),
  minimumStay: z.string().optional(),
  description: z.string().optional(),
  status: z.string().optional(),
  amenities: z.string().optional(), // JSON string
});

export const updateFlatSchema = createFlatSchema.partial();

export const updateFlatStatusSchema = z.object({
    status: z.enum(['available', 'unavailable'], {
        message: "Invalid status provided. Must be 'available' or 'unavailable'."
    }),
});
