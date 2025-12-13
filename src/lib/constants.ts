// Auction form constants
export const AUCTION_CONSTANTS = {
  // Default tags/fields for auction creation
  DEFAULT_TAGS: [
    { key: "Condition", value: "" },
    { key: "Age", value: "" },
    { key: "Working Status", value: "" },
  ],

  // Maximum number of custom fields
  MAX_CUSTOM_FIELDS: 5,

  // Condition options
  CONDITION_OPTIONS: [
    "Brand New",
    "Like New",
    "Very Good",
    "Good",
    "Fair",
    "Poor",
  ],

  // Age options
  AGE_OPTIONS: [
    "Less than 6 months",
    "6 months - 1 year",
    "1-2 years",
    "2-5 years",
    "5+ years",
  ],

  // Working Status options
  WORKING_STATUS_OPTIONS: [
    "Fully Functional",
    "Partially Functional",
    "Not Working",
    "Unknown",
  ],

  // Image upload constraints
  IMAGE_CONSTRAINTS: {
    MAX_FILES: 10,
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    MAX_WIDTH: 2000,
    MAX_HEIGHT: 2000,
    COMPRESSION_QUALITY: 0.8,
    ACCEPTED_FORMATS: ["image/jpeg", "image/png", "image/webp"],
  },

  // Auction timing constraints
  TIMING: {
    MIN_DURATION_HOURS: 1,
    MAX_DURATION_DAYS: 90,
    DEFAULT_DURATION_DAYS: 7,
  },

  // Price constraints
  PRICING: {
    MIN_STARTING_PRICE: 1,
    MAX_STARTING_PRICE: 10000000,
  },
  // Category options (industry-standard common categories with subcategories)
  CATEGORY_OPTIONS: [
    { id: "all", label: "All Items", sub: [] },

    {
      id: "electronics",
      label: "Electronics",
      sub: [
        "Mobile Phones",
        "Laptops & Computers",
        "Cameras & Photography",
        "TV & Home Audio",
        "Gaming Consoles",
        "Smart Watches & Wearables",
        "Computer Parts",
        "Phone Accessories",
        "Other Electronics",
      ],
    },

    {
      id: "vehicles",
      label: "Vehicles",
      sub: [
        "Motorcycles",
        "Cars",
        "Scooters",
        "Electric Vehicles",
        "Pickups & Vans",
        "Tractors & Heavy Machinery",
        "Spare Parts",
        "Helmets & Riding Gear",
        "Other Vehicles",
      ],
    },

    {
      id: "real_estate",
      label: "Real Estate",
      sub: [
        "Land",
        "Houses",
        "Apartments",
        "Commercial Space",
        "Rentals",
        "Other Real Estate",
      ],
    },

    {
      id: "antiques",
      label: "Antiques",
      sub: [
        "Furniture",
        "Coins & Currency",
        "Collectibles",
        "Vintage Items",
        "Other Antiques",
      ],
    },

    {
      id: "art",
      label: "Art & Handmade",
      sub: [
        "Paintings",
        "Sculptures",
        "Handmade Crafts",
        "Decorative Art",
        "Other Art",
      ],
    },

    {
      id: "fashion",
      label: "Fashion",
      sub: [
        "Men's Clothing",
        "Women's Clothing",
        "Shoes",
        "Bags",
        "Watches",
        "Jewelry",
        "Accessories",
        "Other Fashion",
      ],
    },

    {
      id: "home",
      label: "Home & Living",
      sub: [
        "Furniture",
        "Home Appliances",
        "Kitchen & Dining",
        "Home Decor",
        "Cleaning & Organization",
        "Other Home & Living",
      ],
    },

    {
      id: "sports",
      label: "Sports & Outdoors",
      sub: [
        "Bicycles",
        "Gym & Fitness",
        "Outdoor Gear",
        "Sports Equipment",
        "Other Sports",
      ],
    },

    {
      id: "tools",
      label: "Tools & Industrial",
      sub: [
        "Power Tools",
        "Hand Tools",
        "Construction Equipment",
        "Agricultural Tools",
        "Industrial Machines",
        "Other Tools",
      ],
    },

    {
      id: "toys",
      label: "Toys & Hobbies",
      sub: [
        "Kids Toys",
        "Board Games",
        "Musical Instruments",
        "Drones & RC",
        "Crafts & DIY",
        "Other Toys & Hobbies",
      ],
    },

    {
      id: "books",
      label: "Books & Education",
      sub: [
        "School Books",
        "College Books",
        "Novels & Literature",
        "Comics & Manga",
        "Educational Materials",
        "Other Books",
      ],
    },

    {
      id: "business",
      label: "Business & Office",
      sub: [
        "Office Supplies",
        "Printers & Accessories",
        "Commercial Equipment",
        "POS Machines",
        "Other Business Items",
      ],
    },
  ],
};
