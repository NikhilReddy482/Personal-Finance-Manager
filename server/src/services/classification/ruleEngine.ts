import { TransactionType } from '../../config/constants';

export interface IMerchantMatch {
  merchantName: string;
  mainCategory: string;
  subcategory: string;
  leafCategory: string;
  transactionType: TransactionType;
  confidence: number;
}

export class RuleEngine {
  static normalizeDescription(raw: string): string {
    if (!raw) return '';
    let cleaned = raw
      .replace(/[\u2013\u2014]/g, '-') // Normalize em/en dashes
      .replace(/["']/g, '')
      .toUpperCase();

    // Clean bank prefix/suffix patterns while preserving meaningful keywords
    cleaned = cleaned.replace(/UPI\/[A-Z0-9_-]+\/[A-Z0-9_-]+\//gi, ' ');
    cleaned = cleaned.replace(/UPI\/[A-Z0-9_-]+\b/gi, ' ');
    cleaned = cleaned.replace(/UPI[-/\s]+[A-Z0-9_.-]+@[A-Z]+/gi, ' ');
    cleaned = cleaned.replace(/\b(IMPS|NEFT|RTGS|ACH|POS|ECOM|CMS|INB|INF|VPS|TPV)[-/:0-9A-Z]+/gi, ' ');
    cleaned = cleaned.replace(/\bCARD\/[-/:0-9A-Z]+/gi, ' ');
    cleaned = cleaned.replace(/\bBILL\/[-/:0-9A-Z]+/gi, ' ');
    cleaned = cleaned.replace(/\bINT\/[-/:0-9A-Z]+/gi, ' ');
    cleaned = cleaned.replace(/\b\d{10,24}\b/g, ' ');
    cleaned = cleaned.replace(/\bXX\d{4}\b/gi, ' ');
    cleaned = cleaned.replace(/\b\d{2}[A-Z]{3}\d{2,4}\b/gi, ' ');
    
    // Remove isolated DR/CR tokens and commas leftover from CSV column merges
    cleaned = cleaned.replace(/\b(CR|DR)\b/g, ' ');
    cleaned = cleaned.replace(/[,;]+/g, ' ');
    cleaned = cleaned.replace(/[^A-Z0-9\s&.-]/g, ' ');
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    return cleaned || raw.trim();
  }

  static matchMerchant(description: string, amountMinor: number): IMerchantMatch | null {
    const desc = (description || '').toUpperCase();

    // 1. Refunds & Reversals & Cashback (High Priority)
    if (desc.includes('REFUND') || desc.includes('REVERSAL') || desc.includes('CASHBACK') || desc.includes('REIMBURSEMENT')) {
      let merchant = 'Merchant Refund';
      let mainCat = 'Refunds & Cashback';
      let subCat = 'Merchant Refund';
      let leaf = 'Refund';
      if (desc.includes('AMAZON')) {
        merchant = 'Amazon';
        mainCat = 'Shopping & Retail';
        subCat = 'Online Marketplaces';
        leaf = 'Amazon';
      } else if (desc.includes('FLIPKART')) {
        merchant = 'Flipkart';
        mainCat = 'Shopping & Retail';
        subCat = 'Online Marketplaces';
        leaf = 'Flipkart';
      } else if (desc.includes('SWIGGY') || desc.includes('ZOMATO')) {
        merchant = 'Food Delivery Refund';
        mainCat = 'Food & Dining';
        subCat = 'Food Delivery';
        leaf = 'Refund';
      }
      return { merchantName: merchant, mainCategory: mainCat, subcategory: subCat, leafCategory: leaf, transactionType: 'REFUND', confidence: 0.98 };
    }

    // 2. Transfers & Family / P2P
    if (
      desc.includes('TRANSFER FROM FAMILY') ||
      desc.includes('FAMILY') ||
      desc.includes('TRANSFER TO') ||
      desc.includes('TRANSFER FROM') ||
      desc.includes('P2P') ||
      desc.includes('PERSONAL TRANSFER') ||
      desc.includes('SENT TO') ||
      desc.includes('RECEIVED FROM') ||
      desc.includes('FRIEND') ||
      desc.includes('SELF TRANSFER') ||
      desc.includes('INTERNAL TRANSFER')
    ) {
      return {
        merchantName: 'Personal Transfer',
        mainCategory: 'Transfers',
        subcategory: desc.includes('FAMILY') ? 'Family & Friends' : 'Personal Transfers',
        leafCategory: 'P2P Transfer',
        transactionType: desc.includes('FROM') || desc.includes('RECEIVED') ? 'INCOME' : 'TRANSFER',
        confidence: 0.96,
      };
    }

    // 3. Salary & Income
    if (desc.includes('SALARY') || desc.includes('PAYROLL') || desc.includes('STIPEND') || desc.includes('HONORARIUM')) {
      return { merchantName: 'Employer Salary', mainCategory: 'Income', subcategory: 'Salary', leafCategory: 'Full-time Salary', transactionType: 'INCOME', confidence: 0.99 };
    }
    if (desc.includes('INTEREST CREDIT') || desc.includes('SAVINGS INTEREST') || desc.includes('INT CREDIT') || desc.includes('INTEREST') || desc.includes('DIVIDEND')) {
      return { merchantName: 'Bank Interest', mainCategory: 'Income', subcategory: 'Interest & Dividends', leafCategory: 'Savings Interest', transactionType: 'INCOME', confidence: 0.98 };
    }
    if (desc.includes('FREELANCE') || desc.includes('CONSULTING') || desc.includes('CLIENT PAYMENT') || desc.includes('COMMISSION') || desc.includes('CONSULTANCY')) {
      return { merchantName: 'Client Payment', mainCategory: 'Income', subcategory: 'Freelance & Consulting', leafCategory: 'Contract Income', transactionType: 'INCOME', confidence: 0.96 };
    }

    // 4. Food & Dining
    if (desc.includes('SWIGGY') || desc.includes('BUNDL TECHNOLOGIES')) {
      return { merchantName: 'Swiggy', mainCategory: 'Food & Dining', subcategory: 'Food Delivery', leafCategory: 'Swiggy', transactionType: 'EXPENSE', confidence: 0.99 };
    }
    if (desc.includes('ZOMATO')) {
      return { merchantName: 'Zomato', mainCategory: 'Food & Dining', subcategory: 'Food Delivery', leafCategory: 'Zomato', transactionType: 'EXPENSE', confidence: 0.99 };
    }
    if (desc.includes('STARBUCKS') || desc.includes('CAFE COFFEE DAY') || desc.includes('THIRD WAVE') || desc.includes('BLUE TOKAI') || desc.includes('COFFEE') || desc.includes('TEA') || desc.includes('CHAI')) {
      return { merchantName: 'Cafe / Coffee', mainCategory: 'Food & Dining', subcategory: 'Cafes & Bakeries', leafCategory: 'Coffee Shops', transactionType: 'EXPENSE', confidence: 0.96 };
    }
    if (desc.includes('BLINKIT') || desc.includes('ZEPTO') || desc.includes('INSTAMART') || desc.includes('BIGBASKET') || desc.includes('DMART') || desc.includes('GROCERY') || desc.includes('SUPERMARKET') || desc.includes('PROVISION') || desc.includes('NATURES BASKET')) {
      return { merchantName: 'Groceries Store', mainCategory: 'Food & Dining', subcategory: 'Groceries', leafCategory: 'Supermarket', transactionType: 'EXPENSE', confidence: 0.97 };
    }
    if (
      desc.includes('RESTAURANT') ||
      desc.includes('URBAN SPICE') ||
      desc.includes('DINING') ||
      desc.includes('BIRYANI') ||
      desc.includes('PIZZA') ||
      desc.includes('DOMINOS') ||
      desc.includes('BURGER') ||
      desc.includes('MCDONALDS') ||
      desc.includes('KFC') ||
      desc.includes('SUBWAY') ||
      desc.includes('TACO BELL') ||
      desc.includes('DHABA') ||
      desc.includes('BAKERY') ||
      desc.includes('EATERY') ||
      desc.includes('BISTRO') ||
      desc.includes('FOOD COURT') ||
      desc.includes('KITCHEN') ||
      desc.includes('TIFFIN') ||
      desc.includes('HALDIRAM') ||
      desc.includes('SWEETS')
    ) {
      return { merchantName: 'Restaurant / Dining', mainCategory: 'Food & Dining', subcategory: 'Restaurants & Dining', leafCategory: 'Restaurant', transactionType: 'EXPENSE', confidence: 0.95 };
    }

    // 5. Shopping, Retail & Electronics
    if (desc.includes('AMAZON') && !desc.includes('PRIME')) {
      return { merchantName: 'Amazon', mainCategory: 'Shopping & Retail', subcategory: 'Online Marketplaces', leafCategory: 'Amazon', transactionType: 'EXPENSE', confidence: 0.98 };
    }
    if (desc.includes('FLIPKART') || desc.includes('MYNTRA') || desc.includes('AJIO') || desc.includes('MEESHO') || desc.includes('NYKAA') || desc.includes('TATA CLIQ')) {
      return { merchantName: 'Online Shopping', mainCategory: 'Shopping & Retail', subcategory: 'Online Marketplaces', leafCategory: 'Fashion & Apparel', transactionType: 'EXPENSE', confidence: 0.96 };
    }
    if (
      desc.includes('ELECTRONICS') ||
      desc.includes('CROMA') ||
      desc.includes('RELIANCE DIGITAL') ||
      desc.includes('VIJAY SALES') ||
      desc.includes('APPLE') ||
      desc.includes('SAMSUNG') ||
      desc.includes('ONEPLUS') ||
      desc.includes('GADGET')
    ) {
      return { merchantName: 'Electronics Store', mainCategory: 'Shopping & Retail', subcategory: 'Electronics & Gadgets', leafCategory: 'Electronics Store', transactionType: 'EXPENSE', confidence: 0.96 };
    }
    if (
      desc.includes('ZARA') ||
      desc.includes('H&M') ||
      desc.includes('UNIQLO') ||
      desc.includes('TRENDS') ||
      desc.includes('MAX FASHION') ||
      desc.includes('PANTALOONS') ||
      desc.includes('LIFESTYLE') ||
      desc.includes('BATA') ||
      desc.includes('DECATHLON') ||
      desc.includes('IKEA') ||
      desc.includes('MALL') ||
      desc.includes('STORE') ||
      desc.includes('RETAIL')
    ) {
      return { merchantName: 'Retail Store', mainCategory: 'Shopping & Retail', subcategory: 'Apparel & Department Stores', leafCategory: 'Retail Store', transactionType: 'EXPENSE', confidence: 0.93 };
    }

    // 6. Education & Learning
    if (
      desc.includes('COURSE FEE') ||
      desc.includes('ONLINE LEARNING') ||
      desc.includes('UDEMY') ||
      desc.includes('COURSERA') ||
      desc.includes('EDX') ||
      desc.includes('UPGRAD') ||
      desc.includes('UNACADEMY') ||
      desc.includes('COLLEGE') ||
      desc.includes('UNIVERSITY') ||
      desc.includes('SCHOOL') ||
      desc.includes('TUITION') ||
      desc.includes('EXAM FEE') ||
      desc.includes('EDUCATION') ||
      desc.includes('TRAINING') ||
      desc.includes('ACADEMY') ||
      desc.includes('STUDY')
    ) {
      return { merchantName: 'Educational Institute', mainCategory: 'Education', subcategory: 'Courses & Tuition', leafCategory: 'Online Learning', transactionType: 'EXPENSE', confidence: 0.97 };
    }

    // 7. Entertainment & Leisure
    if (
      desc.includes('BOOKMYSHOW') ||
      desc.includes('PVR') ||
      desc.includes('INOX') ||
      desc.includes('CINEPOLIS') ||
      desc.includes('CINEMA') ||
      desc.includes('MOVIE') ||
      desc.includes('THEATRE') ||
      desc.includes('CONCERT') ||
      desc.includes('EVENTS') ||
      desc.includes('SHOWS')
    ) {
      return { merchantName: 'BookMyShow / Cinema', mainCategory: 'Entertainment', subcategory: 'Movies & Events', leafCategory: 'Movie Tickets', transactionType: 'EXPENSE', confidence: 0.98 };
    }
    if (desc.includes('NETFLIX') || desc.includes('PRIME VIDEO') || desc.includes('HOTSTAR') || desc.includes('DISNEY') || desc.includes('SONYLIV') || desc.includes('ZEE5')) {
      return { merchantName: 'OTT Streaming', mainCategory: 'Digital & Subscriptions', subcategory: 'Video Streaming (OTT)', leafCategory: 'Video Subscription', transactionType: 'EXPENSE', confidence: 0.99 };
    }
    if (desc.includes('SPOTIFY') || desc.includes('APPLE MUSIC') || desc.includes('GAANA') || desc.includes('WYNK') || desc.includes('YOUTUBE')) {
      return { merchantName: 'Music Streaming', mainCategory: 'Digital & Subscriptions', subcategory: 'Music & Audio', leafCategory: 'Streaming Service', transactionType: 'EXPENSE', confidence: 0.98 };
    }
    if (desc.includes('CHATGPT') || desc.includes('OPENAI') || desc.includes('GITHUB') || desc.includes('AWS') || desc.includes('MICROSOFT') || desc.includes('GOOGLE CLOUD')) {
      return { merchantName: 'Cloud & Developer Tools', mainCategory: 'Digital & Subscriptions', subcategory: 'Software & Cloud', leafCategory: 'Developer Subscription', transactionType: 'EXPENSE', confidence: 0.98 };
    }

    // 8. Transportation & Travel
    if (desc.includes('UBER')) {
      return { merchantName: 'Uber', mainCategory: 'Transportation', subcategory: 'Cabs & Ride Hailing', leafCategory: 'Uber', transactionType: 'EXPENSE', confidence: 0.99 };
    }
    if (desc.includes('OLA CABS') || desc.includes('ANI TECHNOLOGIES') || desc.includes('RAPIDO') || desc.includes('CAB') || desc.includes('AUTO') || desc.includes('TAXI')) {
      return { merchantName: 'Ride Hailing', mainCategory: 'Transportation', subcategory: 'Cabs & Ride Hailing', leafCategory: 'Cab & Auto', transactionType: 'EXPENSE', confidence: 0.96 };
    }
    if (desc.includes('PETROL') || desc.includes('INDIAN OIL') || desc.includes('IOCL') || desc.includes('HPCL') || desc.includes('BPCL') || desc.includes('SHELL') || desc.includes('DIESEL') || desc.includes('CNG') || desc.includes('FUEL')) {
      return { merchantName: 'Fuel Station', mainCategory: 'Transportation', subcategory: 'Fuel', leafCategory: 'Petrol & Fuel', transactionType: 'EXPENSE', confidence: 0.97 };
    }
    if (desc.includes('IRCTC') || desc.includes('INDIAN RAILWAYS') || desc.includes('METRO') || desc.includes('TRAIN')) {
      return { merchantName: 'Railways / Metro', mainCategory: 'Transportation', subcategory: 'Public Transit', leafCategory: 'Train (IRCTC)', transactionType: 'EXPENSE', confidence: 0.98 };
    }
    if (desc.includes('INDIGO') || desc.includes('AIR INDIA') || desc.includes('SPICEJET') || desc.includes('MAKEMYTRIP') || desc.includes('EASEMYTRIP') || desc.includes('GOIBIBO') || desc.includes('FLIGHT') || desc.includes('AIRLINES')) {
      return { merchantName: 'Airlines / Travel', mainCategory: 'Transportation', subcategory: 'Flights & Travel', leafCategory: 'Airlines', transactionType: 'EXPENSE', confidence: 0.97 };
    }
    if (desc.includes('FASTAG') || desc.includes('TOLL') || desc.includes('PARKING')) {
      return { merchantName: 'Toll & Parking', mainCategory: 'Transportation', subcategory: 'Tolls & Parking', leafCategory: 'FASTag Toll', transactionType: 'EXPENSE', confidence: 0.97 };
    }

    // 9. Utilities & Bills
    if (desc.includes('AIRTEL') || desc.includes('JIO') || desc.includes('VODAFONE') || desc.includes('VI BILL') || desc.includes('BSNL') || desc.includes('TELECOM') || desc.includes('POSTPAID') || desc.includes('PREPAID')) {
      return { merchantName: 'Telecom Provider', mainCategory: 'Utilities & Bills', subcategory: 'Mobile & Telephone', leafCategory: 'Postpaid Mobile Bill', transactionType: 'EXPENSE', confidence: 0.98 };
    }
    if (desc.includes('ELECTRICITY') || desc.includes('BESCOM') || desc.includes('TNEB') || desc.includes('TATA POWER') || desc.includes('POWER') || desc.includes('DISCOM')) {
      return { merchantName: 'Electricity Board', mainCategory: 'Utilities & Bills', subcategory: 'Electricity', leafCategory: 'Power Grid Bill', transactionType: 'EXPENSE', confidence: 0.98 };
    }
    if (desc.includes('WATER') || desc.includes('GAS') || desc.includes('LPG') || desc.includes('INDANE') || desc.includes('HP GAS') || desc.includes('BHARAT GAS') || desc.includes('BROADBAND') || desc.includes('ACT FIBERNET')) {
      return { merchantName: 'Utilities & Services', mainCategory: 'Utilities & Bills', subcategory: 'Home Utilities', leafCategory: 'Broadband / Gas / Water', transactionType: 'EXPENSE', confidence: 0.96 };
    }

    // 10. Cash & ATM
    if (desc.includes('ATM') || desc.includes('CASH WITHDRAWAL') || desc.includes('ATM CASH') || desc.includes('NFS WDL') || desc.includes('ATM WDL')) {
      return { merchantName: 'ATM Cash Withdrawal', mainCategory: 'Cash & ATM', subcategory: 'Cash Withdrawal', leafCategory: 'ATM Cash Withdrawal', transactionType: 'CASH_WITHDRAWAL', confidence: 0.99 };
    }

    // 11. Healthcare & Medical
    if (desc.includes('HOSPITAL') || desc.includes('CLINIC') || desc.includes('DOCTOR') || desc.includes('PHARMACY') || desc.includes('MEDICINE') || desc.includes('APOLLO') || desc.includes('MEDPLUS') || desc.includes('1MG') || desc.includes('NETMEDS') || desc.includes('DIAGNOSTICS') || desc.includes('DENTAL') || desc.includes('HEALTH')) {
      return { merchantName: 'Healthcare & Pharmacy', mainCategory: 'Healthcare', subcategory: 'Medical & Pharmacy', leafCategory: 'Pharmacy', transactionType: 'EXPENSE', confidence: 0.97 };
    }

    // 12. Housing & Maintenance
    if (desc.includes('RENT') || desc.includes('HOUSE RENT') || desc.includes('MAINTENANCE') || desc.includes('SOCIETY') || desc.includes('APARTMENT') || desc.includes('NOBROKER')) {
      return { merchantName: 'Housing & Rent', mainCategory: 'Housing', subcategory: 'Rent & Maintenance', leafCategory: 'House Rent', transactionType: 'EXPENSE', confidence: 0.97 };
    }

    // 13. Loans, Credit Cards & Debt
    if (desc.includes('CREDIT CARD') || desc.includes('CC PAYMENT') || desc.includes('CRED') || desc.includes('AUTOPAY') || desc.includes('LOAN') || desc.includes('EMI') || desc.includes('BAJAJ FINANCE')) {
      return { merchantName: 'Loan / Credit Card', mainCategory: 'Debt & Loans', subcategory: 'Credit Cards & EMI', leafCategory: 'Card Payment', transactionType: 'DEBT_PAYMENT', confidence: 0.97 };
    }

    // 14. Investments
    if (desc.includes('ZERODHA') || desc.includes('GROWW') || desc.includes('UPSTOX') || desc.includes('ANGEL ONE') || desc.includes('STOCKS') || desc.includes('EQUITY')) {
      return { merchantName: 'Investment Platform', mainCategory: 'Investments', subcategory: 'Stocks & Equities', leafCategory: 'Stocks', transactionType: 'INVESTMENT', confidence: 0.98 };
    }
    if (desc.includes('MUTUAL FUND') || desc.includes('HDFC MF') || desc.includes('SBI MF') || desc.includes('NIPPON') || desc.includes('SIP') || desc.includes('PPF') || desc.includes('NPS') || desc.includes('GOLD')) {
      return { merchantName: 'Mutual Fund SIP', mainCategory: 'Investments', subcategory: 'Mutual Funds & SIP', leafCategory: 'Equity SIP', transactionType: 'INVESTMENT', confidence: 0.98 };
    }

    // 15. Bank Fees & Taxes
    if (desc.includes('SMS CHG') || desc.includes('ANNUAL FEE') || desc.includes('SERVICE CHG') || desc.includes('BANK CHARGES') || desc.includes('CONVENIENCE FEE')) {
      return { merchantName: 'Bank Charges', mainCategory: 'Bank Charges & Taxes', subcategory: 'Bank Charges', leafCategory: 'Bank Charges', transactionType: 'FEE', confidence: 0.98 };
    }
    if (desc.includes('TAX') || desc.includes('INCOME TAX') || desc.includes('GST') || desc.includes('TDS')) {
      return { merchantName: 'Government Tax', mainCategory: 'Bank Charges & Taxes', subcategory: 'Taxes', leafCategory: 'Direct Tax', transactionType: 'EXPENSE', confidence: 0.97 };
    }

    // 16. Personal Care & Fitness
    if (desc.includes('SALON') || desc.includes('SPA') || desc.includes('BEAUTY') || desc.includes('URBAN COMPANY') || desc.includes('GYM') || desc.includes('FITNESS') || desc.includes('CULT.FIT')) {
      return { merchantName: 'Fitness & Grooming', mainCategory: 'Personal Care', subcategory: 'Fitness & Grooming', leafCategory: 'Gym & Salon', transactionType: 'EXPENSE', confidence: 0.95 };
    }

    return null;
  }
}

