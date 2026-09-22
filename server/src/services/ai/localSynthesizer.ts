export class LocalFinancialSynthesizer {
  static synthesize(
    userMessage: string,
    insights: any,
    budgets: any[] = [],
    recentTxns: any[] = []
  ): string {
    const period = insights.period || 'Current Period';
    const totalIncome = insights.current?.totalIncome || 0;
    const totalExpense = insights.current?.totalExpense || 0;
    const savings = insights.current?.savings || 0;
    const savingsRate = insights.current?.savingsRate || 0;
    const healthGrade = insights.aiAnalysis?.healthGrade || (savingsRate >= 20 ? 'A' : savingsRate >= 10 ? 'B' : 'C');
    const healthScore = insights.aiAnalysis?.financialHealthScore || Math.min(100, Math.max(30, Math.round(50 + savingsRate * 0.8)));
    const topCategories = insights.topCategories || [];
    const topMerchants = insights.topMerchants || [];
    const rule503020 = insights.rule503020 || {};
    const recurring = insights.recurringSummary || {};

    const topCat1 = topCategories[0] ? `${topCategories[0].category} (₹${topCategories[0].totalAmount.toLocaleString('en-IN')})` : 'General Expenses';
    const topCat2 = topCategories[1] ? `${topCategories[1].category} (₹${topCategories[1].totalAmount.toLocaleString('en-IN')})` : '';

    const lower = userMessage.toLowerCase();

    // 1. Spending Evaluation Query ("Are my spendings good?", "How am I doing?")
    if (lower.includes('good') || lower.includes('how') || lower.includes('health') || lower.includes('score') || lower.includes('evaluate')) {
      return `### 📊 Financial Health & Spending Evaluation for **${period}**

Your current overall Financial Health Score is **${healthScore}/100** (Rating: **Grade ${healthGrade}**).

---

### 💵 Core Cash Flow Summary
* **Total Inflow (Income)**: **₹${totalIncome.toLocaleString('en-IN')}**
* **Total Outflow (Expenses)**: **₹${totalExpense.toLocaleString('en-IN')}**
* **Net Cash Flow / Savings**: **₹${savings.toLocaleString('en-IN')}**
* **Savings Rate**: **${savingsRate}%** *(Target benchmark: ≥ 20%)*

${savingsRate >= 20 
  ? `> **🌟 Strong Financial Discipline**: You are saving **${savingsRate}%** of your earnings, comfortably beating the standard 20% personal finance benchmark.`
  : `> **💡 Opportunity for Optimization**: Your current savings rate is **${savingsRate}%**. Trimming non-essential discretionary expenses could help elevate this toward the 20% milestone.`
}

---

### 🥧 50/30/20 Budget Distribution
* **Needs (Essentials)**: **₹${(rule503020.needs?.amount || 0).toLocaleString('en-IN')}** (*${rule503020.needs?.percentage || 0}%* vs 50% target)
* **Wants (Discretionary)**: **₹${(rule503020.wants?.amount || 0).toLocaleString('en-IN')}** (*${rule503020.wants?.percentage || 0}%* vs 30% target)
* **Savings & Investments**: **₹${(rule503020.savings?.amount || 0).toLocaleString('en-IN')}** (*${rule503020.savings?.percentage || 0}%* vs 20% target)

---

### 🎯 Key Action Items to Optimize
1. **Manage Top Outflow Drivers**: Your largest expense area is **${topCat1}**${topCat2 ? ` followed by **${topCat2}**` : ''}.
2. **Subscriptions Audit**: You have **₹${(recurring.totalMonthlyCommitment || 0).toLocaleString('en-IN')}** in monthly recurring commitments.
3. **Surplus Deployment**: Direct surplus monthly savings of **₹${Math.max(0, savings).toLocaleString('en-IN')}** into high-yield investments or emergency reserves.`;
    }

    // 2. Top Expenses Query ("What are my top expenses?", "biggest spending")
    if (lower.includes('top') || lower.includes('expense') || lower.includes('driver') || lower.includes('spend')) {
      return `### 💳 Top Spending Drivers for **${period}**

Here is the exact breakdown of where your capital was deployed during this period:

---

### 🏷️ Top Spending Categories
${topCategories.map((c: any, i: number) => `${i + 1}. **${c.category}**: **₹${c.totalAmount.toLocaleString('en-IN')}** (*${c.percentage}%* of total expenses)`).join('\n')}

---

### 🏛️ Top Payees & Merchants
${topMerchants.slice(0, 5).map((m: any, i: number) => `${i + 1}. **${m.merchant}**: **₹${m.totalAmount.toLocaleString('en-IN')}** (${m.count || m.transactionCount} payments)`).join('\n') || '*No merchant data available*'}

> **💡 Advisor Insight**: Your single largest spending driver is **${topCat1}**. Keeping this category within an allocated budget is your highest-leverage way to boost monthly savings.`;
    }

    // 3. Subscriptions Query
    if (lower.includes('subscription') || lower.includes('recurring') || lower.includes('bills')) {
      const activeSubs = recurring.activeSubscriptions || [];
      return `### 🔄 Active Subscriptions & Recurring Commitments

* **Total Monthly Commitment**: **₹${(recurring.totalMonthlyCommitment || 0).toLocaleString('en-IN')}**
* **Active Recurring Services**: ${activeSubs.length > 0 ? activeSubs.map((s: any) => `**${s.merchant}** (₹${(s.amountMinor / 100).toLocaleString('en-IN')})`).join(', ') : 'No recurring subscriptions detected'}

> **💡 Recommendation**: Review recurring platforms quarterly and cancel inactive memberships to free up capital.`;
    }

    // 4. Default Comprehensive Financial Synthesis
    return `### 💡 Financial Flow Summary for **${period}**

* **Total Income**: **₹${totalIncome.toLocaleString('en-IN')}**
* **Total Expenses**: **₹${totalExpense.toLocaleString('en-IN')}**
* **Net Surplus / Savings**: **₹${savings.toLocaleString('en-IN')}** (*${savingsRate}%* savings rate)
* **Financial Health Grade**: **${healthGrade}** (${healthScore}/100)

**Top Expense Categories**:
${topCategories.slice(0, 3).map((c: any) => `* **${c.category}**: ₹${c.totalAmount.toLocaleString('en-IN')} (${c.percentage}%)`).join('\n')}

Feel free to ask me for specific budget recommendations, merchant breakdowns, or strategies to grow your savings rate!`;
  }
}
