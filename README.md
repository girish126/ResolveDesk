# Complaint Management

## Start the backend server

Open a terminal in the `backend` directory and run:

```powershell
npm install
npm run dev
```

The API starts at `http://localhost:5001` to match the frontend API default. The root route (`/`) reports that the API is running. The database health endpoint is `http://localhost:5001/api/health`.

## Database setup

The backend uses PostgreSQL through Prisma. Create `backend/.env` with a connection string for your local or hosted database:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"
PORT=5001
FRONTEND_URL="http://localhost:3000"
JWT_ACCESS_SECRET="replace-with-a-long-random-secret-for-access-tokens"
JWT_REFRESH_SECRET="replace-with-a-different-long-random-secret-for-refresh-tokens"
ACCESS_TOKEN_TTL_SECONDS=900
REFRESH_TOKEN_DAYS=7
FIREBASE_WEB_API_KEY="your-firebase-web-api-key"
```

Apply the Prisma migrations with:

```powershell
cd backend
npm run prisma:migrate
```

Authentication uses a short-lived access token returned by `/api/auth/login` and a rotating refresh token in an HttpOnly cookie. Call `POST /api/auth/refresh` to rotate the tokens. Store the access token in client memory and send it as `Authorization: Bearer <token>` for protected routes. Set both JWT secrets to separate, strong random values in production.

Forgot-password emails use Firebase Authentication. Enable **Email/Password** under Firebase Authentication sign-in providers, authorize the frontend host domain, and provide `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, and `NEXT_PUBLIC_FIREBASE_APP_ID` in `frontend/.env.local`. The matching Web API key must also be set as `FIREBASE_WEB_API_KEY` in `backend/.env`; backend login verifies the password with Firebase before issuing application tokens.

For production, compile and start the server with:

```powershell
cd backend
npm run build
npm start
```
