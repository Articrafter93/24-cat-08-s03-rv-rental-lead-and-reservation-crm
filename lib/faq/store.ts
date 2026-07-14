import { randomUUID } from "crypto";
import type { FaqEntry } from "./types";

// In-memory FAQ knowledge base — editable by non-technical staff via /knowledge.
// Sandbox scope (mirrors lib/data/local-store.ts pattern): resets on server restart.
// Demonstrates the job post requirement "organize and structure company
// information, FAQs... to improve AI learning and automation accuracy" —
// this is the structured data the voice/chat agent (Fase 3) retrieves from.

function seed(): FaqEntry[] {
  const now = new Date();
  const entries: Array<Omit<FaqEntry, "id" | "updatedAt">> = [
    {
      category: "Rental Requirements",
      question: "What do I need to rent an RV?",
      answer:
        "A valid driver's license held for at least 2 years, proof of insurance or our protection plan, and a major credit card in the renter's name for the security deposit.",
      keywords: ["requirements", "need", "rent", "license", "documents"],
    },
    {
      category: "Rental Requirements",
      question: "Is there a minimum rental period?",
      answer: "Yes, our standard minimum rental is 3 nights. Holiday and peak-season bookings require a 5-night minimum.",
      keywords: ["minimum", "nights", "period", "duration"],
    },
    {
      category: "Age & ID Policy",
      question: "What is the minimum age to rent an RV?",
      answer: "Renters must be at least 25 years old. Drivers between 21-24 may qualify with an additional young-driver fee and supervisor approval.",
      keywords: ["age", "minimum", "young", "21", "25", "id"],
    },
    {
      category: "Age & ID Policy",
      question: "Can someone else drive the RV besides me?",
      answer: "Yes, up to 2 additional drivers can be added at no extra cost. Each additional driver must meet the same age and license requirements and be listed on the rental agreement.",
      keywords: ["additional driver", "co-driver", "another person"],
    },
    {
      category: "Insurance & Protection",
      question: "Do I need separate insurance, or is it included?",
      answer: "Basic liability coverage is included in every rental. We offer an optional Premium Protection Plan that reduces your deductible to $0 and covers interior damage.",
      keywords: ["insurance", "protection", "coverage", "deductible", "damage"],
    },
    {
      category: "Insurance & Protection",
      question: "What happens if the RV is damaged during my trip?",
      answer: "Report any damage immediately via the RV Corp support line. Without the Premium Protection Plan, you're responsible for repair costs up to your policy deductible.",
      keywords: ["damage", "accident", "report", "repair"],
    },
    {
      category: "Pet Policy",
      question: "Are pets allowed in the RV?",
      answer: "Yes, pets are welcome in most of our fleet for a $75 pet fee per trip. Please let us know in advance so we can assign a pet-friendly unit and note any allergy-sensitive cleaning needs.",
      keywords: ["pet", "dog", "cat", "animal", "pets allowed"],
    },
    {
      category: "Mileage",
      question: "Is mileage included in the rental price?",
      answer: "Each rental includes 100 miles per day. Additional miles are billed at $0.45/mile. Unlimited mileage packages are available for trips over 10 days.",
      keywords: ["mileage", "miles", "included", "unlimited", "extra"],
    },
    {
      category: "Pickup & Drop-off",
      question: "What are the pickup and drop-off procedures?",
      answer: "Pickup includes a 30-minute walkthrough covering systems and safety. Drop-off requires returning the RV with the fresh water tank filled and the waste tanks emptied at a dump station.",
      keywords: ["pickup", "drop-off", "return", "walkthrough", "process"],
    },
    {
      category: "Pickup & Drop-off",
      question: "Can I get a late pickup or early drop-off?",
      answer: "Late pickup (after 6 PM) and early drop-off (before 8 AM) can be arranged with 48 hours' notice, subject to a $50 after-hours fee.",
      keywords: ["late", "early", "after hours", "time"],
    },
    {
      category: "Cancellation Policy",
      question: "What is your cancellation policy?",
      answer: "Full refund if canceled 14+ days before pickup. 50% refund for 7-13 days before. No refund inside 7 days, though we'll gladly rebook your dates within 12 months.",
      keywords: ["cancel", "cancellation", "refund", "reschedule"],
    },
    {
      category: "Booking Process",
      question: "How do I book an RV?",
      answer: "Submit an inquiry through our website, chat, or voice line with your dates, group size, and RV type preference. Our team confirms availability and sends a booking link within one business hour.",
      keywords: ["book", "booking", "reserve", "reservation", "process"],
    },
    {
      category: "Booking Process",
      question: "How far in advance should I book?",
      answer: "We recommend booking 4-6 weeks ahead for standard dates and 3+ months ahead for peak summer weekends and holidays, when our most popular units sell out fast.",
      keywords: ["advance", "how early", "book ahead"],
    },
    {
      category: "Support Hours",
      question: "What are your support hours?",
      answer: "Our team is available by phone and chat 7 AM - 9 PM daily. The AI assistant handles inquiries 24/7 and escalates urgent or after-hours matters to on-call staff.",
      keywords: ["hours", "support", "available", "open", "24/7"],
    },
  ];

  return entries.map((e) => ({ ...e, id: randomUUID(), updatedAt: now }));
}

const globalForFaq = globalThis as unknown as { faqStore: FaqEntry[] | undefined };

export const faqStore: FaqEntry[] = globalForFaq.faqStore ?? seed();

if (process.env.NODE_ENV !== "production") globalForFaq.faqStore = faqStore;
