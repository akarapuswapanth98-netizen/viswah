export const PLANS = [
  {
    id: "free", name: "Free", price_inr: 0, badge_label: "Free",
    target_learner: "Try VISWAH before upgrading",
    features: [
      "Basic courses & lessons", "Basic Piano & Drums", "Basic Vocal Guru",
      "Basic Music Lab (10 exercises/day)", "Basic World Music exploration",
      "Basic AI Coach (5 requests/day)", "Basic progress tracking",
      "Basic achievements", "Community access",
    ],
  },
  {
    id: "student", name: "Student", price_inr: 99, badge_label: "Best for Students",
    target_learner: "College students & beginner learners",
    features: [
      "Full course access", "More AI Coach (30/day)",
      "Full Music Lab (50/day)", "Full Practice Studio",
      "Full progress analytics", "Advanced achievements & missions",
      "World Music expanded", "Community challenges",
      "Priority access to new content",
    ],
  },
  {
    id: "premium", name: "Premium", price_inr: 299, badge_label: "Most Popular",
    target_learner: "Serious music learners",
    features: [
      "Everything in Student", "Highest AI Coach (100/day)",
      "Advanced Music Lab (200/day)", "Advanced Vocal Guru",
      "Advanced analytics & skill tracking",
      "Advanced World Music content", "Advanced practice insights",
      "Premium learning paths & challenges",
      "Detailed progress history",
    ],
  },
  {
    id: "pro", name: "Pro", price_inr: 699, badge_label: "For Professionals",
    target_learner: "Advanced musicians & creators",
    features: [
      "Everything in Premium", "Pro-level AI Coach (500/day)",
      "Extended Music Lab (1000/day)", "Creator-oriented tools",
      "Advanced performance tracking", "Advanced learning insights",
      "Priority access to new features", "Pro badge",
    ],
  },
];

export function formatPrice(priceInr) {
  if (priceInr === 0) return "Free";
  return `\u20b9${priceInr.toLocaleString("en-IN")}`;
}
