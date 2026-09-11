# Budget hosting — checked 11 September 2026

The selected stack is **PostgreSQL + Prisma + Cloudinary**. Store product text, price, stock and image URLs in PostgreSQL. Store image files in Cloudinary.

| Part | Starting option | Current free-plan considerations |
| --- | --- | --- |
| PostgreSQL | Neon Free | 0.5 GB database storage per project; compute and network quotas also apply. |
| PostgreSQL alternative | Supabase Free | 500 MB database per project; low-activity projects may pause after 7 days. |
| Photos | Cloudinary Image and Video API Free | 25 monthly credits shared across storage, transformations and delivery; no credit card required. This is not the separate time-limited DAM trial. |
| Next.js frontend | Netlify Free | Commercial projects allowed; credit/usage limits apply. |
| Node API preview | Render Free | Sleeps after 15 minutes of inactivity; wake-up can take about a minute. Local files do not survive restarts/redeploys. Unsuitable for dependable customer-facing performance. |

For this store, using your available AWS hosting for the app while keeping the database on Neon and images on Cloudinary is a reasonable starting point. Verify exactly what your AWS offer covers and when it expires. Application hosting can then change without moving product photos.

Cloudinary currently describes its free API plan as free forever, but usage limits and future terms can change. No provider's free plan should be treated as a guaranteed unlimited 1–2-year hosting contract. Keep original photos and database exports backed up separately.

Example: 1,000 products × 4 photos × 200 KB is approximately 800 MB of stored photos, before derived images/backups. Visitor downloads also consume delivery quota. The backend resizes images to fit within 1600×2000 and encodes WebP at quality 80; the actual file size depends on image content.

Firebase remains an alternative, but Cloud Storage for Firebase now requires a Blaze billing-linked project. New buckets only qualify for Google Cloud Storage's Always Free offering in selected US regions; free quotas are not the same as a no-billing-account service. Vercel Hobby is restricted to personal/non-commercial use and is not the free hosting choice for this commercial store.

Sources:

- [Neon pricing](https://neon.com/pricing)
- [Supabase pricing](https://supabase.com/pricing)
- [Supabase inactivity policy](https://supabase.com/docs/guides/platform/free-project-pausing)
- [Cloudinary pricing and credit model](https://cloudinary.com/pricing)
- [Netlify pricing](https://www.netlify.com/pricing/)
- [Netlify commercial projects on Free](https://www.netlify.com/blog/introducing-netlify-free-plan/)
- [Render free service limitations](https://render.com/docs/free)
- [Firebase Storage billing changes](https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024)
- [Vercel pricing](https://vercel.com/pricing)
