# RegisTrack
### Student Document Request & Tracking System

<sub>**Client Preview Version | Under Active Development**</sub>

RegisTrack is a full-stack student document request and tracking system designed to streamline document processing and communication between students, staff, and administrators.

This version is presented as a **client preview** to demonstrate the system's current features, workflows, and overall functionality. The application is still undergoing revisions, improvements, and refinements based on testing and client feedback.

Built with React, Flutter, and ASP.NET Core, RegisTrack provides a unified experience across web and mobile platforms.

RegisTrack is a full-stack student document request and tracking system. It provides role-based access for students, staff, and administrators across a React web application, a Flutter mobile application, and an ASP.NET Core backend API.

## Clone the Project

Clone the complete RegisTrack repository from GitHub:

```bash
git clone https://github.com/TechGid27/RegisTrack.git
cd RegisTrack
git checkout main
```

This repository contains all three applications in one workspace:

```text
RegisTrack/
├── Frontend/             # React and Vite web application
├── Mobile_1/             # Flutter mobile application
└── Registrack.api/       # ASP.NET Core backend API
```

## Components

| Component | Technology | Responsibility | Documentation |
|---|---|---|---|
| Frontend | React 19, Vite, Material UI | Web interface for authentication, document requests, announcements, profiles, and administration | [Frontend README](Frontend/README.md) |
| Mobile_1 | Flutter and Dart | Native mobile experience for student and administrator workflows | [Mobile README](Mobile_1/README.md) |
| Registrack.api | ASP.NET Core 10, SQL Server, EF Core | REST API, JWT authentication, file uploads, email processing, and SignalR updates | [API README](Registrack.api/README.md) |

## System Architecture

```text
React Web Client --------\
                          ├── HTTP REST API ── SQL Server
Flutter Mobile Client ----/     │
                                  └── SignalR (/hubs/requests)
```

The web and mobile applications communicate with the API over HTTP and receive real-time request updates through SignalR. The API manages user roles, authentication, document workflows, uploads, announcements, and email notifications.

## Development Hosts

| Service | Default URL |
|---|---|
| Backend API | http://localhost:5097 |
| REST API | http://localhost:5097/api |
| Swagger UI | http://localhost:5097/swagger |
| SignalR hub | http://localhost:5097/hubs/requests |
| Frontend | http://localhost:5173 |

## Prerequisites

Install the tools required for the components you plan to run:

- .NET 10 SDK
- SQL Server or SQL Server Express
- Node.js 20 or newer
- npm
- Flutter SDK with Dart 3.11.1 or newer
- Android Studio, Xcode, or a configured Flutter target
- Git

## Local Setup

### 1. Start the SQL Server database

Create a SQL Server database and configure its connection string in `Registrack.api/appsettings.json`. Do not commit real credentials.

Use `Registrack.api/appsettings.json.example` as the configuration template.

### 2. Run the backend API

```powershell
cd Registrack.api
dotnet restore
dotnet ef database update
dotnet run
```

The API is available at `http://localhost:5097`, with Swagger documentation at `http://localhost:5097/swagger`.

### 3. Run the web frontend

```powershell
cd Frontend
npm install
npm run dev
```

The frontend API configuration is stored in `Frontend/src/api/Client.js`.

### 4. Run the mobile application

```powershell
cd Mobile_1
flutter pub get
flutter run
```

The API configuration is stored in `Mobile_1/lib/services/api_config.dart`. For Android emulator testing, use `10.0.2.2` instead of `localhost`. For a physical device, use the computer's LAN IP address and allow the API port through the firewall.

## Repository Structure

```text
RegisTrack/
├── Frontend/             # React and Vite web application
├── Mobile_1/             # Flutter mobile application
├── Registrack.api/       # ASP.NET Core backend API
└── README.md             # Monorepo documentation
```

## Security

- Keep database credentials, JWT secrets, SMTP credentials, and API keys in local configuration files.
- `appsettings.json` files should remain excluded from Git.
- Use environment variables or a secrets manager for production deployments.
- Rotate any credential that has previously been committed to source control.
- Configure restricted CORS and JWT settings for public deployments.

