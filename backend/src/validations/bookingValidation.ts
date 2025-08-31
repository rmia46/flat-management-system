// backend/src/validations/bookingValidation.ts
import { z } from 'zod';

export const createBookingSchema = z.object({
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid start date' }),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid end date' }),
});

export const requestExtensionSchema = z.object({
    newEndDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid new end date' }),
});
