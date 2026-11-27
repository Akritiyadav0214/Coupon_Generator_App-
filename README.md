# MessMate – Smart Digital Lunch Coupon Management System

## Live Deployment

Frontend: https://messmate-frontend-2u3m.onrender.com

Backend API: https://coupon-generator-app.onrender.com

## Demo Credentials

### Admin Account
- Username: YOUR_ADMIN_EMAIL
- Password: YOUR_ADMIN_PASSWORD

### Student Account
- Username: YOUR_STUDENT_EMAIL
- Password: YOUR_STUDENT_PASSWORD

## Project Overview

MessMate is a smart digital lunch coupon management system developed
for managing student lunch coupons digitally.

It helps digitize coupon generation, validation, and management,
making the mess coupon process more efficient.

## Technologies Used

- React.js
- Vite
- Node.js
- Express.js
- MongoDB
- JWT Authentication
- REST API
- Render Deployment

## Admin Setup and Verification

Create the initial admin account from the project root after configuring `server/.env` with
`MONGODB_URI` and a strong `JWT_SECRET`:

```bash
npm run admin:create
```

The script prompts for the admin name, email, and password; password entry is masked and uses the
existing bcrypt hash method. Do not pass passwords as command-line arguments or add them to source
control. Student registration always creates a `student` role; it cannot grant admin access.

Start the app locally and sign in through the existing login page:

```bash
npm run dev
```

The admin account redirects to `/admin`; students continue to `/student`. The admin APIs are also
protected on the server: an unauthenticated request to
`http://localhost:5000/api/admin/dashboard` should return `401`, a student token should return
`403`, and a signed-in admin should receive MongoDB dashboard data (`200`). The frontend production
build and lint checks can be run with `npm run build` and `npm run lint`.