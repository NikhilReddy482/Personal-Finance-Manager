import mongoose from 'mongoose';
import { User } from '../../models/User';
import { Account } from '../../models/Account';
import { Transaction } from '../../models/Transaction';
import { Budget } from '../../models/Budget';
import { Goal } from '../../models/Goal';
import { hashPassword, generateFingerprint } from '../../security/crypto';
import { toMinorUnits } from '../../utils/money';

export async function seedDemoDataForUser(userId: mongoose.Types.ObjectId) {
  // Clear any previous data for this user
  await Account.deleteMany({ userId });
  await Transaction.deleteMany({ userId });
  await Budget.deleteMany({ userId });
  await Goal.deleteMany({ userId });

  // 1. Create realistic Accounts
  const savingsAccount = await Account.create({
    userId,
    name: 'HDFC Salary Savings',
    institutionName: 'HDFC Bank',
    accountType: 'SAVINGS',
    currency: 'INR',
    maskedIdentifier: '•••• 4821',
    openingBalanceMinor: 15000000, // ₹1,50,000
    currentBalanceMinor: 15000000,
    isActive: true,
  });

  const creditCard = await Account.create({
    userId,
    name: 'ICICI Sapphiro Credit Card',
    institutionName: 'ICICI Bank',
    accountType: 'CREDIT_CARD',
    currency: 'INR',
    maskedIdentifier: '•••• 9104',
    openingBalanceMinor: 0,
    currentBalanceMinor: 0,
    creditLimitMinor: 30000000, // ₹3,00,000
    isActive: true,
  });

  // 2. Generate 3 months of rich transactions
  const now = new Date();
  const txTemplates = [
    // Salaries
    { desc: 'ACME CORP SALARY OCT', merchant: 'Acme Corp', cat: 'Income', sub: 'Salary', leaf: 'Full-time Salary', type: 'INCOME', amt: 125000, dayOffset: 1, acc: savingsAccount._id },
    { desc: 'ACME CORP SALARY NOV', merchant: 'Acme Corp', cat: 'Income', sub: 'Salary', leaf: 'Full-time Salary', type: 'INCOME', amt: 125000, dayOffset: 31, acc: savingsAccount._id },
    { desc: 'ACME CORP SALARY DEC', merchant: 'Acme Corp', cat: 'Income', sub: 'Salary', leaf: 'Full-time Salary', type: 'INCOME', amt: 125000, dayOffset: 61, acc: savingsAccount._id },

    // Rent & Utilities
    { desc: 'UPI/RENT TO LANDLORD', merchant: 'Landlord Rent', cat: 'Housing & Rent', sub: 'Rent', leaf: 'Apartment Rent', type: 'EXPENSE', amt: 32000, dayOffset: 3, acc: savingsAccount._id },
    { desc: 'BESCOM POWER BILL', merchant: 'Electricity Board', cat: 'Utilities & Bills', sub: 'Electricity', leaf: 'Power Grid Bill', type: 'EXPENSE', amt: 2450, dayOffset: 5, acc: savingsAccount._id },
    { desc: 'AIRTEL BROADBAND FIBER', merchant: 'Airtel', cat: 'Utilities & Bills', sub: 'Internet & Broadband', leaf: 'Fiber Internet', type: 'EXPENSE', amt: 1179, dayOffset: 7, acc: creditCard._id },

    // Subscriptions
    { desc: 'NETFLIX SUBSCRIPTION', merchant: 'Netflix', cat: 'Digital & Subscriptions', sub: 'Video Streaming (OTT)', leaf: 'Netflix', type: 'EXPENSE', amt: 649, dayOffset: 10, acc: creditCard._id },
    { desc: 'SPOTIFY PREMIUM MONTHLY', merchant: 'Spotify', cat: 'Digital & Subscriptions', sub: 'Music Streaming', leaf: 'Spotify', type: 'EXPENSE', amt: 119, dayOffset: 12, acc: creditCard._id },
    { desc: 'OPENAI CHATGPT PLUS', merchant: 'OpenAI', cat: 'Digital & Subscriptions', sub: 'Software & AI', leaf: 'ChatGPT Plus', type: 'EXPENSE', amt: 1999, dayOffset: 15, acc: creditCard._id },

    // Groceries & Food
    { desc: 'BLINKIT QUICK COMMERCE', merchant: 'Blinkit', cat: 'Food & Dining', sub: 'Groceries', leaf: 'Supermarket', type: 'EXPENSE', amt: 1420, dayOffset: 4, acc: creditCard._id },
    { desc: 'SWIGGY ORDER BANGALORE', merchant: 'Swiggy', cat: 'Food & Dining', sub: 'Food Delivery', leaf: 'Swiggy', type: 'EXPENSE', amt: 580, dayOffset: 8, acc: creditCard._id },
    { desc: 'ZOMATO RESTAURANT DINING', merchant: 'Zomato', cat: 'Food & Dining', sub: 'Food Delivery', leaf: 'Zomato', type: 'EXPENSE', amt: 1850, dayOffset: 14, acc: creditCard._id },
    { desc: 'STARBUCKS COFFEE', merchant: 'Starbucks', cat: 'Food & Dining', sub: 'Cafes & Bakeries', leaf: 'Coffee Shops', type: 'EXPENSE', amt: 740, dayOffset: 18, acc: creditCard._id },

    // Transport
    { desc: 'UBER TRIP BANGALORE', merchant: 'Uber', cat: 'Transportation', sub: 'Cabs & Ride Hailing', leaf: 'Uber', type: 'EXPENSE', amt: 420, dayOffset: 6, acc: creditCard._id },
    { desc: 'SHELL PETROL STATION', merchant: 'Shell', cat: 'Transportation', sub: 'Fuel', leaf: 'Petrol', type: 'EXPENSE', amt: 3200, dayOffset: 16, acc: creditCard._id },

    // Investments & SIPs
    { desc: 'HDFC MF EQUITY SIP', merchant: 'HDFC Mutual Fund', cat: 'Investments', sub: 'Mutual Funds & SIP', leaf: 'Equity SIP', type: 'INVESTMENT', amt: 20000, dayOffset: 10, acc: savingsAccount._id },
    { desc: 'ZERODHA BROKING EQUITY', merchant: 'Zerodha', cat: 'Investments', sub: 'Stocks & Equities', leaf: 'Stocks', type: 'INVESTMENT', amt: 15000, dayOffset: 20, acc: savingsAccount._id },

    // Anomaly test transaction (High ticket electronics)
    { desc: 'CHELSEA ELECTRONICS IPHONE', merchant: 'Apple Store', cat: 'Shopping & Retail', sub: 'Electronics & Gadgets', leaf: 'Mobile Phones', type: 'EXPENSE', amt: 84900, dayOffset: 22, acc: creditCard._id, isAnomaly: true, anomalyReason: 'Amount of ₹84,900 is 14.5x your typical Shopping spend.' },
  ];

  const docsToInsert = [];
  for (const t of txTemplates) {
    const txDate = new Date(now.getTime() - t.dayOffset * 24 * 60 * 60 * 1000);
    const amountMinor = toMinorUnits(t.amt);
    const fingerprint = generateFingerprint(`${userId}:${t.acc}:${txDate.toISOString().split('T')[0]}:${amountMinor}:${t.desc}`);

    docsToInsert.push({
      userId,
      accountId: t.acc,
      date: txDate,
      description: t.desc,
      normalizedDescription: t.desc,
      amountMinor,
      currency: 'INR',
      transactionType: t.type,
      merchant: t.merchant,
      category: t.cat,
      subcategory: t.sub,
      leafCategory: t.leaf,
      categoryPath: `${t.cat} > ${t.sub}`,
      classificationConfidence: 0.98,
      classificationMethod: 'MERCHANT',
      fingerprint,
      source: 'CSV',
      isAnomaly: t.isAnomaly || false,
      anomalyReason: t.anomalyReason,
      reviewStatus: 'CONFIRMED',
    });
  }

  await Transaction.insertMany(docsToInsert);

  // 3. Create sample Budgets
  const currentMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  await Budget.create([
    {
      userId,
      period: currentMonth,
      category: 'Food & Dining',
      amountLimitMinor: toMinorUnits(15000), // ₹15,000
      alertThresholdPercent: 80,
    },
    {
      userId,
      period: currentMonth,
      category: 'Transportation',
      amountLimitMinor: toMinorUnits(10000), // ₹10,000
      alertThresholdPercent: 80,
    },
    {
      userId,
      period: currentMonth,
      category: 'Digital & Subscriptions',
      amountLimitMinor: toMinorUnits(5000), // ₹5,000
      alertThresholdPercent: 80,
    },
  ]);

  // 4. Create sample Goals
  await Goal.create([
    {
      userId,
      name: 'Emergency Fund (6 Months)',
      targetAmountMinor: toMinorUnits(500000), // ₹5,00,000
      currentAmountMinor: toMinorUnits(280000), // ₹2,80,000
      targetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      priority: 'HIGH',
    },
    {
      userId,
      name: 'MacBook Pro M3 Max',
      targetAmountMinor: toMinorUnits(220000), // ₹2,20,000
      currentAmountMinor: toMinorUnits(140000), // ₹1,40,000
      targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      priority: 'MEDIUM',
    },
  ]);

  return { message: 'Demo data seeded successfully with realistic accounts, transactions, budgets, and goals.' };
}

export async function ensureDemoUserExists(): Promise<any> {
  let user = await User.findOne({ email: 'demo@financialflow.io' });
  if (!user) {
    const passwordHash = await hashPassword('DemoPass@1234');
    user = await User.create({
      fullName: 'Alex Morgan (Demo User)',
      email: 'demo@financialflow.io',
      passwordHash,
      emailVerified: true,
      mfaEnabled: false,
    });
    await seedDemoDataForUser(user._id);
  }
  return user;
}

