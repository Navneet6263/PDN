import type { PaymentProvider } from "./payments";
export type ServerConfig = {
  email: string;
  hash: string;
  origin: string;
  secure: boolean;
  uploadDir?: string;
  imageStorage?: "local" | "cloudinary";
  // Online gateway (Razorpay, or the test gateway in development). null = COD only.
  onlinePayment?: PaymentProvider | null;
};
