# Payment & Commission Financial Ledger — Zesty Platform

Zesty calculates transparent pricing, platform commissions, and payout earnings for every completed food order.

---

## 💰 Financial Breakdown Math

Given a cart with food item total $F$:

$$\text{Food Subtotal} = F$$
$$\text{Packaging Charge} = \text{₹20}$$
$$\text{Taxable Amount} = F + 20$$
$$\text{GST Tax (5\%)} = \text{Math.round}(\text{Taxable Amount} \times 0.05)$$
$$\text{Delivery Fee} = \text{₹40}$$
$$\text{Grand Total} = F + 20 + \text{GST Tax} + 40$$

### Earnings & Commission Breakdown
- **Platform Commission (5%)**: $0.05 \times F$
- **Net Restaurant Earnings**: $F - \text{Platform Commission} + \text{Packaging Charge}$
- **Rider Delivery Payout**: $\text{Delivery Fee} = \text{₹40}$
