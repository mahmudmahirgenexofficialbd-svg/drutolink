# DrutoLink — Vercel + UddoktaPay setup

## 1. Vercel Environment Variables

In Vercel: Project → Settings → Environment Variables, add:

- `UDDOKTAPAY_API_KEY` = your UddoktaPay API key
- `UDDOKTAPAY_BASE_URL` = `https://drutolink.paymently.io/api`

The server accepts either a UddoktaPay installation URL or an `/api` URL. It normalizes the value so the Create Charge endpoint becomes:

`https://drutolink.paymently.io/api/checkout-v2`

The API key is sent using the required header:

`RT-UDDOKTAPAY-API-KEY`

Do NOT put the API key in frontend code or commit it to GitHub.

## 2. Deploy

Push the project to GitHub. Vercel will build it with `npm run build`.

The API endpoints are:

- `POST /api/uddoktapay/create`
- `POST /api/uddoktapay/verify`
- `POST /api/uddoktapay/webhook`

## 3. Payment flow

1. DrutoLink creates the order as `PENDING`.
2. `/api/uddoktapay/create` calls UddoktaPay `checkout-v2`.
3. Customer is redirected to the returned `payment_url`.
4. UddoktaPay redirects back to DrutoLink with `invoice_id`.
5. DrutoLink calls `verify-payment` using that invoice ID.
6. The app checks the returned `order_id` and payment amount against the Firestore order.
7. Only a `COMPLETED` payment with a matching amount is marked `PAID` / `Order Placed`.

## 4. After changing Environment Variables

Redeploy the Vercel project so the serverless functions receive the new values.
