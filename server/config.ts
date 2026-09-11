export type ServerConfig = {
  email: string;
  hash: string;
  origin: string;
  secure: boolean;
  uploadDir?: string;
  imageStorage?: "local" | "cloudinary";
};
