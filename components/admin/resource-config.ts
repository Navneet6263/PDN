import type { Field, RecordData } from "./ControlFields";
export type ResourceConfig = {
  path: string;
  title: string;
  description: string;
  columns: string[];
  blank: RecordData;
  fields: Field[];
  remove?: boolean;
};
export const resources: Record<string, ResourceConfig> = {
  Categories: {
    path: "categories",
    title: "Categories",
    description:
      "Control navigation order and product categories. Lower position appears first. Hiding a category hides its products from the storefront.",
    columns: ["label", "slug", "position", "active"],
    remove: true,
    blank: {
      slug: "",
      label: "",
      image: "",
      subCategories: [],
      position: 0,
      active: true,
    },
    fields: [
      { key: "label", label: "Category name", required: true },
      {
        key: "slug",
        label: "URL slug",
        required: true,
        hint: "Lowercase words with hyphens. Cannot change after creating.",
      },
      { key: "position", label: "Display position", type: "number" },
      { key: "active", label: "Visible on storefront", type: "checkbox" },
      {
        key: "subCategories",
        label: "Product types (comma separated)",
        type: "list",
      },
      { key: "image", label: "Category image", type: "image" },
    ],
  },
  Coupons: {
    path: "coupons",
    title: "Coupons",
    description:
      "Discount codes customers type at checkout. Percent and flat discounts apply to items; a fixed order total makes the whole order cost that amount (use it only for payment tests and switch it off afterwards). Limits of 0 mean no limit. Cancelled orders give their use back.",
    columns: ["code", "type", "value", "used", "maxUses", "active"],
    remove: true,
    blank: {
      code: "",
      description: "",
      type: "percent",
      value: 10,
      minOrder: 0,
      maxDiscount: 0,
      maxUses: 0,
      perCustomer: 1,
      allowedEmails: [],
      active: true,
      startsAt: null,
      endsAt: null,
    },
    fields: [
      {
        key: "code",
        label: "Code",
        required: true,
        hint: "Letters and numbers, e.g. DIWALI20. Cannot change after creating.",
      },
      {
        key: "description",
        label: "Shown to customer",
        hint: "e.g. 20% off up to ₹500",
      },
      {
        key: "type",
        label: "Discount type",
        type: "select",
        options: ["percent", "flat", "fixed_total"],
      },
      {
        key: "value",
        label: "Value",
        type: "number",
        hint: "percent: 20 = 20% off · flat: ₹ off · fixed_total: order costs this many ₹",
      },
      { key: "minOrder", label: "Minimum bag value (₹)", type: "number" },
      {
        key: "maxDiscount",
        label: "Largest discount (₹, percent only)",
        type: "number",
      },
      { key: "maxUses", label: "Total uses allowed", type: "number" },
      { key: "perCustomer", label: "Uses per customer", type: "number" },
      {
        key: "allowedEmails",
        label: "Only these customer emails (comma separated, optional)",
        type: "list",
      },
      { key: "startsAt", label: "Starts (optional)", type: "datetime" },
      { key: "endsAt", label: "Ends (optional)", type: "datetime" },
      { key: "active", label: "Coupon active", type: "checkbox" },
    ],
  },
  Banners: {
    path: "banners",
    title: "Banners",
    description:
      "Hero banners appear at the top; promotion banners appear above the catalog. Lower position appears first. Schedule uses your local timezone. Preview the storefront after saving.",
    columns: ["title", "slot", "position", "active"],
    remove: true,
    blank: {
      title: "",
      subtitle: "",
      eyebrow: "",
      image: "",
      mobileImage: "",
      buttonLabel: "Shop now",
      link: "/#catalog",
      destination: "link",
      productIds: [],
      slot: "hero",
      position: 0,
      active: false,
      startsAt: null,
      endsAt: null,
    },
    fields: [
      { key: "title", label: "Banner title", required: true },
      { key: "eyebrow", label: "Small heading" },
      { key: "subtitle", label: "Description", type: "textarea" },
      { key: "image", label: "Desktop image", type: "image" },
      { key: "mobileImage", label: "Mobile image (optional)", type: "image" },
      { key: "buttonLabel", label: "Button text" },
      {
        key: "link",
        label: "Button destination",
        hint: "Example: /?category=women#catalog or /product/product-slug",
        required: true,
      },
      {
        key: "slot",
        label: "Placement",
        type: "select",
        options: ["hero", "promo"],
      },
      { key: "position", label: "Display position", type: "number" },
      { key: "startsAt", label: "Start time (optional)", type: "datetime" },
      { key: "endsAt", label: "End time (optional)", type: "datetime" },
      { key: "active", label: "Enable banner", type: "checkbox" },
    ],
  },
  "Team & Roles": {
    path: "team",
    title: "Team & Roles",
    description:
      "Admin: all controls. Inventory: view products and update stock. Support: manage tickets and notes. Updating an account signs it out. The store owner account remains available.",
    columns: ["name", "email", "role", "active"],
    remove: true,
    blank: {
      name: "",
      email: "",
      role: "inventory",
      active: true,
      password: "",
    },
    fields: [
      { key: "name", label: "Name", required: true },
      { key: "email", label: "Email", type: "email", required: true },
      {
        key: "role",
        label: "Role",
        type: "select",
        options: ["admin", "inventory", "support"],
      },
      { key: "active", label: "Account enabled", type: "checkbox" },
      {
        key: "password",
        label: "Password",
        type: "password",
        hint: "At least 8 characters for new accounts. Leave blank to retain an existing password.",
      },
    ],
  },
  "Sales & Regions": {
    path: "sales",
    title: "Sales & Regions",
    description:
      "Record sales from other channels, such as an in-store counter, Instagram or WhatsApp. Website orders appear under Orders and on the Overview dashboard automatically.",
    columns: ["orderRef", "region", "amount", "status", "soldAt"],
    remove: true,
    blank: {
      orderRef: "",
      customerEmail: "",
      region: "",
      amount: 0,
      status: "completed",
      soldAt: new Date().toISOString(),
    },
    fields: [
      { key: "orderRef", label: "Unique order reference", required: true },
      {
        key: "customerEmail",
        label: "Customer email",
        type: "email",
        required: true,
      },
      { key: "region", label: "State / region", required: true },
      { key: "amount", label: "Order value (INR)", type: "number" },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: ["completed", "returned", "replaced", "cancelled"],
      },
      { key: "soldAt", label: "Sale date", type: "datetime", required: true },
    ],
  },
  Support: {
    path: "support",
    title: "Support",
    description:
      "Record customer enquiries and track their resolution. Conversation notes are stored here; they are not sent as email or WhatsApp messages.",
    columns: ["subject", "customer", "priority", "status"],
    blank: {
      customer: "",
      email: "",
      subject: "",
      message: "",
      priority: "medium",
      status: "open",
      assigneeId: null,
    },
    fields: [
      { key: "customer", label: "Customer name", required: true },
      { key: "email", label: "Customer email", type: "email", required: true },
      { key: "subject", label: "Subject", required: true },
      {
        key: "message",
        label: "Customer enquiry",
        type: "textarea",
        required: true,
      },
      {
        key: "priority",
        label: "Priority",
        type: "select",
        options: ["low", "medium", "high"],
      },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: ["open", "pending", "resolved"],
      },
    ],
  },
};
