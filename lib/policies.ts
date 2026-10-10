import type { StoreSettings } from "./store-types";

// Public policy pages that payment gateways (PayU, Razorpay) and Indian
// e-commerce rules expect. Each page uses the admin's own text when set in
// Store Settings, otherwise a standard template built from the store's real
// settings (delivery fee, COD, contact details).
export const policyPages = [
  ["about-us", "About Us"],
  ["contact-us", "Contact Us"],
  ["terms-and-conditions", "Terms & Conditions"],
  ["privacy-policy", "Privacy Policy"],
  ["refund-and-cancellation", "Refund & Cancellation Policy"],
  ["shipping-and-delivery", "Shipping & Delivery Policy"],
] as const;
export type PolicySlug = (typeof policyPages)[number][0];

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export function businessName(s: StoreSettings) {
  return s.legalName || s.storeName;
}

function contactLines(s: StoreSettings) {
  return [
    s.contactEmail && `Email: ${s.contactEmail}`,
    s.contactPhone && `Phone: ${s.contactPhone}`,
    s.businessAddress && `Address: ${s.businessAddress}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function policyText(slug: PolicySlug, s: StoreSettings): string {
  const name = businessName(s);
  const store = s.storeName;
  const contact =
    contactLines(s) || "Contact details are listed on our Contact Us page.";
  const freeShip =
    s.freeShippingAbove > 0
      ? `Delivery is free on orders of ${inr(s.freeShippingAbove)} or more; a delivery fee of ${inr(s.shippingFee)} applies below that.`
      : s.shippingFee > 0
        ? `A delivery fee of ${inr(s.shippingFee)} applies to each order.`
        : "Delivery is free on all orders.";
  switch (slug) {
    case "about-us":
      return (
        s.aboutPage ||
        `${store} is an online fashion store for women, men and kids, run by ${name}. We bring together everyday wear, occasion wear, footwear and accessories at honest prices, shown with the MRP and any discount clearly on every product.

## What we sell
Clothing for women, men and kids, footwear and accessories. Every product page lists the price, available sizes, material, care instructions and exactly what is in the package.

## How we sell
You can pay online through our payment partner PayU (UPI, cards, net banking and wallets)${s.codEnabled ? " or choose cash on delivery" : ""}. Orders are packed and shipped from India, and you can track every order from the My Orders page.

## Get in touch
${contact}`
      );
    case "contact-us":
      return `We are happy to help with orders, sizes, delivery, returns and refunds.

## ${name}
${contact}

## Grievance officer
${s.grievanceOfficer || `Customer care team, ${name}`}
${s.contactEmail ? `Email: ${s.contactEmail}` : ""}
We acknowledge complaints within 48 hours and aim to resolve them within one month of receipt.

## Order help
Signed-in customers can see order status, tracking details and payment status under My Orders, and can cancel an order there until it is packed.`;
    case "terms-and-conditions":
      return (
        s.termsPage ||
        `These terms apply to your use of the ${store} website and to every order placed on it. The website is operated by ${name}. By using the website or placing an order you agree to these terms.

## Accounts
You need an account to place an order. Keep your password private; you are responsible for activity on your account. Give accurate name, mobile number and delivery address details.

## Products and prices
Prices are in Indian rupees (INR) and include applicable taxes unless stated otherwise. We show the MRP and the selling price on each product. Colours on screen may differ slightly from the actual product. We may correct pricing or listing errors; if an error affects your order we will contact you and you may cancel for a full refund.

## Orders
An order is confirmed when you receive an order number and, for online payment, when the payment is successful. Stock is reserved when the order is placed. Unpaid online orders are cancelled automatically after 30 minutes. We may cancel an order if a product becomes unavailable, if payment fails, or if we suspect fraud; any amount paid is refunded in full.

## Payment
Online payments are processed securely by our payment partner PayU. We do not see or store your card details or UPI PIN.${s.codEnabled ? ` Cash on delivery is available on eligible orders${s.codMaxOrder > 0 ? ` up to ${inr(s.codMaxOrder)}` : ""}${s.codFee > 0 ? ` with a handling fee of ${inr(s.codFee)}` : ""}.` : ""}

## Coupons
Coupon codes are subject to their stated limits, validity dates and minimum order values, cannot be exchanged for cash and may be withdrawn at any time.

## Delivery, cancellation and returns
Delivery, cancellation, return and refund terms are set out in our Shipping & Delivery Policy and Refund & Cancellation Policy, which form part of these terms.

## Liability
We are responsible for delivering the products you order as described. We are not liable for indirect losses or for delays caused by events outside our reasonable control.

## Governing law
These terms are governed by the laws of India. Disputes are subject to the jurisdiction of the courts where ${name} is registered.

## Contact
${contact}`
      );
    case "privacy-policy":
      return (
        s.privacyPage ||
        `This policy explains how ${name} ("we") collects, uses and protects your personal data when you use the ${store} website, in line with India's Digital Personal Data Protection Act, 2023 and the Information Technology Act, 2000.

## What we collect
- Account details: your name, email address and password (stored only as a secure hash).
- Order details: delivery name, mobile number and address, the products you order and your order history.
- Payment status: whether a payment succeeded and the payment reference. Card numbers, UPI PINs and bank details are entered on our payment partner PayU's page and are never received or stored by us.
- Reviews and photos you choose to publish.
- Technical data needed to run the website, such as session cookies that keep you signed in and your bag saved.

## How we use it
To create and secure your account, process and deliver orders, take payments through PayU, provide customer support, prevent fraud and meet legal and tax obligations. We do not sell your personal data.

## Who we share it with
Only with service providers who help us run the store: our payment partner (PayU), courier partners (name, phone and address for delivery), and hosting providers. They may use it only to provide their service to us. We may also disclose data where required by law.

## How long we keep it
Account data is kept while your account is active. Order and payment records are kept for as long as tax and accounting laws require.

## Your choices
You can view your orders and saved address in your account, and ask us to correct or delete your personal data, subject to records we must keep by law. Contact us using the details below.

## Security
Passwords are hashed, sessions use secure HTTP-only cookies, and the website is served over HTTPS.

## Contact and grievances
${s.grievanceOfficer || `Grievance officer, ${name}`}
${contact}`
      );
    case "refund-and-cancellation":
      return (
        s.refundPage ||
        `## Cancelling an order
You can cancel an order yourself from My Orders until it has been packed. Once an order is packed or shipped it can no longer be cancelled online; please contact us and we will help where possible. Unpaid online orders are cancelled automatically after 30 minutes.

## Returns and exchanges
${s.returnPolicy || "Unused products with original tags and packaging may be returned within 7 days of delivery. Innerwear, socks, beauty products and items marked non-returnable cannot be returned for hygiene reasons."}
${s.exchangePolicy ? `\n${s.exchangePolicy}` : ""}
To request a return, contact us with your order number. If a product arrives damaged, defective or different from what you ordered, tell us within 48 hours of delivery with photos and we will arrange a replacement or a full refund.

## Refunds
- Cancelled prepaid orders are refunded in full to the original payment method.
- Approved returns are refunded to the original payment method after the returned product reaches us and passes a quality check.
- Cash on delivery orders are refunded by bank transfer or UPI to an account you share with us.
- Refunds are initiated within 2 business days of approval. Your bank or payment provider usually credits the amount within 5–7 business days.
- If money was deducted but your order was not confirmed, contact us with the payment reference; once our payment partner confirms the payment, it is refunded in full.

## Contact
${contact}`
      );
    case "shipping-and-delivery":
      return (
        s.shippingPage ||
        `## Where we deliver
We deliver to serviceable PIN codes across India.

## Delivery charges
${freeShip}${s.codEnabled && s.codFee > 0 ? ` Cash on delivery orders carry a handling fee of ${inr(s.codFee)}.` : ""} Charges are shown at checkout before you pay.

## Dispatch and delivery time
${s.shippingInfo || "Orders are usually packed and dispatched within 1–2 business days. Delivery usually takes 3–7 business days after dispatch depending on your location."} Delays can happen during sales, festivals, bad weather or for remote areas.

## Tracking
Once your order is shipped, the courier name and tracking number appear on your order page under My Orders.

## Failed delivery
If a delivery cannot be completed after the courier's attempts, the order returns to us. Prepaid orders returned this way are refunded as described in our Refund & Cancellation Policy.

## Contact
${contact}`
      );
  }
}
