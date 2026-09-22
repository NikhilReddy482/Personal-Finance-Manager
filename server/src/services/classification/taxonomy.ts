import { TransactionType } from '../../config/constants';

export interface ICategoryTaxonomyNode {
  main: string;
  defaultType: TransactionType;
  icon: string;
  subcategories: {
    name: string;
    leafs: string[];
  }[];
}

export const CATEGORY_TAXONOMY: ICategoryTaxonomyNode[] = [
  {
    main: 'Income',
    defaultType: 'INCOME',
    icon: 'Briefcase',
    subcategories: [
      { name: 'Salary', leafs: ['Full-time Salary', 'Part-time Wages', 'Bonus', 'Overtime'] },
      { name: 'Freelance & Contracting', leafs: ['Client Retainers', 'Project Payments', 'Consulting Fees'] },
      { name: 'Business Income', leafs: ['Product Sales', 'Service Revenue', 'Merchant Payouts'] },
      { name: 'Investment Returns', leafs: ['Dividends', 'Interest Income', 'Capital Gains', 'Rental Income'] },
      { name: 'Government & Grants', leafs: ['Tax Refund', 'Subsidies', 'Pension', 'Social Security'] },
      { name: 'Gifts & Grants', leafs: ['Cash Gifts', 'Inheritance', 'Rewards & Cashback'] },
    ],
  },
  {
    main: 'Food & Dining',
    defaultType: 'EXPENSE',
    icon: 'Utensils',
    subcategories: [
      { name: 'Groceries', leafs: ['Supermarket', 'Vegetables & Fruits', 'Dairy & Eggs', 'Meat & Fish'] },
      { name: 'Restaurants & Dining', leafs: ['Fine Dining', 'Casual Restaurants', 'Fast Food', 'Buffet'] },
      { name: 'Food Delivery', leafs: ['Swiggy', 'Zomato', 'Uber Eats', 'Direct Delivery'] },
      { name: 'Cafes & Bakeries', leafs: ['Coffee Shops', 'Bakeries & Patisseries', 'Tea Stalls'] },
      { name: 'Snacks & Beverages', leafs: ['Packaged Snacks', 'Sodas & Beverages', 'Alcohol & Wine'] },
    ],
  },
  {
    main: 'Housing & Rent',
    defaultType: 'EXPENSE',
    icon: 'Home',
    subcategories: [
      { name: 'Rent', leafs: ['Apartment Rent', 'House Rent', 'Storage Unit'] },
      { name: 'Maintenance & HOA', leafs: ['Society Maintenance', 'HOA Dues', 'Garbage Collection'] },
      { name: 'Home Improvement', leafs: ['Furniture', 'Hardware & Tools', 'Renovations'] },
      { name: 'Repairs & Services', leafs: ['Plumbing', 'Electrical Repair', 'Appliance Repair'] },
    ],
  },
  {
    main: 'Utilities & Bills',
    defaultType: 'EXPENSE',
    icon: 'Zap',
    subcategories: [
      { name: 'Electricity', leafs: ['Power Grid Bill', 'Solar Maintenance'] },
      { name: 'Water & Gas', leafs: ['Water Utility', 'Piped Gas', 'LPG Cylinder'] },
      { name: 'Internet & Broadband', leafs: ['Fiber Internet', 'Wi-Fi Hotspot'] },
      { name: 'Mobile & Telephone', leafs: ['Postpaid Mobile Bill', 'Prepaid Recharge'] },
      { name: 'Cable & DTH', leafs: ['DTH Recharge', 'Cable TV'] },
    ],
  },
  {
    main: 'Transportation',
    defaultType: 'EXPENSE',
    icon: 'Car',
    subcategories: [
      { name: 'Fuel', leafs: ['Petrol', 'Diesel', 'CNG', 'EV Charging'] },
      { name: 'Cabs & Ride Hailing', leafs: ['Uber', 'Ola', 'Rapido', 'Auto Rickshaw'] },
      { name: 'Public Transit', leafs: ['Metro Card', 'Bus Fare', 'Local Train'] },
      { name: 'Travel Intercity', leafs: ['Train (IRCTC)', 'Bus (RedBus)', 'Flights'] },
      { name: 'Vehicle Maintenance', leafs: ['Periodic Service', 'Car Wash', 'Tires'] },
      { name: 'Tolls & Parking', leafs: ['FASTag Toll', 'City Parking', 'Airport Parking'] },
    ],
  },
  {
    main: 'Shopping & Retail',
    defaultType: 'EXPENSE',
    icon: 'ShoppingBag',
    subcategories: [
      { name: 'Clothing & Apparel', leafs: ['Men Fashion', 'Women Fashion', 'Footwear'] },
      { name: 'Electronics & Gadgets', leafs: ['Mobile Phones', 'Laptops & PCs', 'Accessories'] },
      { name: 'Home & Kitchen', leafs: ['Cookware', 'Bedding', 'Appliances'] },
      { name: 'Personal Care & Beauty', leafs: ['Cosmetics', 'Skincare', 'Salon Products'] },
      { name: 'Online Marketplaces', leafs: ['Amazon', 'Flipkart', 'Myntra', 'Meesho'] },
    ],
  },
  {
    main: 'Healthcare & Medical',
    defaultType: 'EXPENSE',
    icon: 'Activity',
    subcategories: [
      { name: 'Doctor Consultation', leafs: ['General Physician', 'Dental', 'Eye Clinic'] },
      { name: 'Pharmacy & Medicines', leafs: ['Prescription Drugs', 'Online Pharmacy', 'Supplements'] },
      { name: 'Diagnostics & Labs', leafs: ['Blood Tests', 'Scans & Imaging'] },
      { name: 'Hospital & Emergency', leafs: ['In-patient Hospitalization', 'Emergency Care'] },
    ],
  },
  {
    main: 'Education & Learning',
    defaultType: 'EXPENSE',
    icon: 'GraduationCap',
    subcategories: [
      { name: 'Tuition & School', leafs: ['School Fees', 'University Tuition'] },
      { name: 'Courses & Training', leafs: ['Online Courses', 'Professional Certifications'] },
      { name: 'Books & Supplies', leafs: ['Textbooks', 'Stationery'] },
    ],
  },
  {
    main: 'Entertainment & Leisure',
    defaultType: 'EXPENSE',
    icon: 'Film',
    subcategories: [
      { name: 'Movies & Events', leafs: ['BookMyShow', 'PVR Cinema', 'Concerts'] },
      { name: 'Gaming', leafs: ['Steam Games', 'PlayStation', 'In-game Purchases'] },
      { name: 'Hobbies', leafs: ['Sports Gear', 'Camping', 'Photography'] },
    ],
  },
  {
    main: 'Digital & Subscriptions',
    defaultType: 'EXPENSE',
    icon: 'Radio',
    subcategories: [
      { name: 'Video Streaming (OTT)', leafs: ['Netflix', 'Amazon Prime', 'Disney+ Hotstar', 'YouTube Premium'] },
      { name: 'Music Streaming', leafs: ['Spotify', 'Apple Music', 'YouTube Music'] },
      { name: 'Cloud & Storage', leafs: ['Google One', 'iCloud', 'Dropbox', 'AWS'] },
      { name: 'Software & AI', leafs: ['ChatGPT Plus', 'GitHub / Copilot', 'Microsoft 365'] },
    ],
  },
  {
    main: 'Investments',
    defaultType: 'INVESTMENT',
    icon: 'TrendingUp',
    subcategories: [
      { name: 'Mutual Funds & SIP', leafs: ['Equity SIP', 'Debt SIP', 'Index Funds'] },
      { name: 'Stocks & Equities', leafs: ['Zerodha', 'Groww', 'Upstox', 'US Stocks'] },
      { name: 'Fixed Deposits & PPF', leafs: ['Bank Fixed Deposit', 'PPF', 'Recurring Deposit'] },
      { name: 'Retirement & Gold', leafs: ['NPS', 'Digital Gold', 'Sovereign Gold Bonds'] },
    ],
  },
  {
    main: 'Loans & Debt',
    defaultType: 'DEBT_PAYMENT',
    icon: 'CreditCard',
    subcategories: [
      { name: 'Home Loan EMI', leafs: ['Home Loan Principal', 'Home Loan Interest'] },
      { name: 'Vehicle Loan EMI', leafs: ['Car Loan EMI', 'Two-wheeler EMI'] },
      { name: 'Personal Loan & BNPL', leafs: ['Personal Loan EMI', 'Simpl / LazyPay'] },
      { name: 'Credit Card Payment', leafs: ['Credit Card Full Payment', 'Credit Card Minimum'] },
    ],
  },
  {
    main: 'Insurance',
    defaultType: 'EXPENSE',
    icon: 'Shield',
    subcategories: [
      { name: 'Health Insurance', leafs: ['Mediclaim Policy', 'Family Floater'] },
      { name: 'Life & Term Insurance', leafs: ['Term Life Premium'] },
      { name: 'Vehicle Insurance', leafs: ['Car Insurance Annual', 'Bike Insurance Annual'] },
    ],
  },
  {
    main: 'Transfers',
    defaultType: 'TRANSFER',
    icon: 'Repeat',
    subcategories: [
      { name: 'Self Transfer', leafs: ['Own Account Transfer', 'Wallet Top-up'] },
      { name: 'Peer-to-Peer Transfer', leafs: ['Sent to Friend/Family', 'Received from Friend/Family'] },
    ],
  },
  {
    main: 'Refunds & Reversals',
    defaultType: 'REFUND',
    icon: 'RotateCcw',
    subcategories: [
      { name: 'Merchant Refund', leafs: ['Return Refund', 'UPI Reversal', 'Cancelled Order Refund'] },
    ],
  },
  {
    main: 'Cash & ATM',
    defaultType: 'CASH_WITHDRAWAL',
    icon: 'DollarSign',
    subcategories: [
      { name: 'Cash Withdrawal', leafs: ['ATM Cash Withdrawal', 'Branch Withdrawal'] },
      { name: 'Cash Deposit', leafs: ['Cash Deposit Machine', 'Branch Cash Deposit'] },
    ],
  },
  {
    main: 'Bank Charges & Taxes',
    defaultType: 'FEE',
    icon: 'Percent',
    subcategories: [
      { name: 'Bank Charges', leafs: ['SMS Alert Charge', 'Annual Card Fee', 'Maintenance Fee'] },
      { name: 'Direct Taxes', leafs: ['Income Tax Advance', 'Self Assessment Tax'] },
    ],
  },
  {
    main: 'Other / Unclassified',
    defaultType: 'EXPENSE',
    icon: 'HelpCircle',
    subcategories: [
      { name: 'General Expense', leafs: ['Miscellaneous Expense', 'Unclassified'] },
      { name: 'General Income', leafs: ['Miscellaneous Income'] },
    ],
  },
];
