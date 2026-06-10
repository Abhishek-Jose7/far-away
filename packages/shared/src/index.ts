import { z } from 'zod';

export const createReportSchema = z.object({
  infrastructure_id: z.string({
    required_error: "Infrastructure ID is required",
  }).min(1, "Infrastructure ID cannot be empty"),
  user_id: z.string({
    required_error: "User ID is required",
  }).min(1, "User ID cannot be empty"),
  description: z.string({
    required_error: "Description is required",
  })
    .min(5, "Description must be at least 5 characters long")
    .max(500, "Description cannot exceed 500 characters"),
  severity: z.enum(['low', 'medium', 'high'], {
    required_error: "Severity level must be low, medium, or high",
  }),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;

export const createAlertSchema = z.object({
  infrastructure_id: z.string().min(1),
  title: z.string().min(3).max(100),
  message: z.string().min(5).max(500),
  severity: z.enum(['warning', 'critical']),
});

export type CreateAlertInput = z.infer<typeof createAlertSchema>;

export const resolveAlertSchema = z.object({
  resolved_by_user_id: z.string().optional(),
});

export type ResolveAlertInput = z.infer<typeof resolveAlertSchema>;
