# RegisTrack Frontend

React and Vite web application for the RegisTrack student document request and tracking system.

## Host Configuration

The frontend expects the backend API at:

```text
http://localhost:5097/api
```

The API host is configured in `src/api/Client.js` through `BASE_URL` and `BASE_HOST`. For a deployed frontend or mobile device, replace these values with the backend server's reachable IP address or HTTPS URL.

## Prerequisites

- Node.js 20 or newer
- npm
- The RegisTrack API running on port `5097`

## Setup

```bash
npm install
npm run dev
```

Vite will print the local frontend URL in the terminal, normally `http://localhost:5173`.

## Commands

```bash
npm run dev      # Start the development server
npm run build    # Create a production build in dist/
npm run lint     # Run ESLint
npm run preview  # Preview the production build
```

## Main Technologies

- React 19
- Vite 8
- React Router 7
- Material UI 7
- Formik and Yup
- Microsoft SignalR

## API Features

The frontend uses JWT authentication stored in local storage, REST endpoints under `/api`, and the SignalR hub at `/hubs/requests` for request updates.
