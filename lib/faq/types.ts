export const FAQ_CATEGORIES = [
  "Rental Requirements",
  "Age & ID Policy",
  "Insurance & Protection",
  "Pet Policy",
  "Mileage",
  "Pickup & Drop-off",
  "Cancellation Policy",
  "Booking Process",
  "Support Hours",
] as const;

export type FaqCategory = (typeof FAQ_CATEGORIES)[number];

export interface FaqEntry {
  id: string;
  category: FaqCategory;
  question: string;
  answer: string;
  keywords: string[];
  updatedAt: Date;
}
