# Skribbl Clone - Frontend

This is the frontend application for the Skribbl Clone project, a real-time multiplayer drawing and guessing game.

## Tech Stack
- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS 4
- **Routing**: React Router DOM (v7)
- **HTTP Client**: Axios
- **WebSockets**: SockJS & STOMP (`@stomp/stompjs`) for real-time multiplayer gameplay

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Environment Variables
Configure your local environment variables. Create a `.env.local` or `.env` file at the root of the project:

```env
VITE_API_BASE_URL=http://localhost:8080
```
*(Replace `http://localhost:8080` with your deployed backend URL if testing against a remote backend locally.)*

### Running Locally
To start the Vite development server with Hot Module Replacement (HMR):
```bash
npm run dev
```

### Building for Production
To build the app for production:
```bash
npm run build
```
This will generate a `dist` folder containing the optimized build.


