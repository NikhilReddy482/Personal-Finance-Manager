import { describe, it, expect } from 'vitest';
import { RuleEngine } from '../src/services/classification/ruleEngine';
import { CATEGORY_TAXONOMY } from '../src/services/classification/taxonomy';

describe('Rule Engine & Taxonomy', () => {
  it('normalizes noisy bank narration strings', () => {
    const raw = 'UPI/428192039481/PAYTO/SWIGGY_BANGALORE/14OCT24/XX4821';
    const cleaned = RuleEngine.normalizeDescription(raw);
    expect(cleaned).toContain('SWIGGY');
    expect(cleaned).not.toContain('XX4821');
  });

  it('matches known merchants deterministically', () => {
    const swiggy = RuleEngine.matchMerchant('SWIGGY BANGALORE ORDER', 54000);
    expect(swiggy).not.toBeNull();
    expect(swiggy?.mainCategory).toBe('Food & Dining');
    expect(swiggy?.subcategory).toBe('Food Delivery');
    expect(swiggy?.confidence).toBeGreaterThanOrEqual(0.95);

    const netflix = RuleEngine.matchMerchant('NETFLIX ENTERTAINMENT SVCS', 64900);
    expect(netflix).not.toBeNull();
    expect(netflix?.mainCategory).toBe('Digital & Subscriptions');
    expect(netflix?.subcategory).toBe('Video Streaming (OTT)');

    const salary = RuleEngine.matchMerchant('MONTHLY SALARY CREDIT OCT 2024', 12500000);
    expect(salary).not.toBeNull();
    expect(salary?.mainCategory).toBe('Income');
    expect(salary?.transactionType).toBe('INCOME');
  });

  it('contains comprehensive category taxonomy', () => {
    expect(CATEGORY_TAXONOMY.length).toBeGreaterThanOrEqual(15);
    const foodCat = CATEGORY_TAXONOMY.find((c) => c.main === 'Food & Dining');
    expect(foodCat).toBeDefined();
    expect(foodCat?.subcategories.length).toBeGreaterThanOrEqual(4);
  });
});
