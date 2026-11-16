# RegisTrack Backend API

ASP.NET Core 10 backend for the RegisTrack student document request and tracking system.

## Server Host

The default development host is:

```text
http://localhost:5097
```

- Swagger UI: `http://localhost:5097/swagger`
- REST API prefix: `http://localhost:5097/api`
- SignalR hub: `http://localhost:5097/hubs/requests`
- Uploaded files: `http://localhost:5097/uploads`

The HTTP host and port are configured in `Properties/launchSettings.json`. The web host currently uses `ASPNETCORE_ENVIRONMENT=Development` for Swagger and developer error output.

## Technology Stack

- ASP.NET Core 10
- Entity Framework Core and SQL Server
- JWT bearer authentication
- BCrypt password hashing
- MailKit SMTP email delivery
- ASP.NET Core SignalR

## Roles

- `Student`: submit, track, and manage own document requests
- `Admin` and `Staff`: process requests and maintain system data

## Project Structure
```
Doctrack-backend-api/
├── Controllers/
│   ├── Auth/
│   │   └── AuthController.cs
│   ├── Admin/
│   │   ├── AnnouncementsController.cs
│   │   ├── DocumentTypesController.cs
│   │   ├── DocumentRequirementsController.cs
│   │   └── SeedController.cs
│   └── Student/
│       └── DocumentRequestsController.cs
├── Models/
├── DTOs/
├── Data/
├── Migrations/
├── Program.cs
└── appsettings.json
```

## API Endpoints

### Auth (`/api/Auth`)
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/Auth/register` | Public |
| POST | `/api/Auth/login` | Public |

### Document Requests (`/api/DocumentRequests`)
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/DocumentRequests` | Authenticated |
| GET | `/api/DocumentRequests/{id}` | Authenticated |
| GET | `/api/DocumentRequests/reference/{ref}` | Public |
| POST | `/api/DocumentRequests` | Student |
| PUT | `/api/DocumentRequests/{id}` | Admin |
| DELETE | `/api/DocumentRequests/{id}` | Student, Admin |
| POST | `/api/DocumentRequests/{id}/upload` | Admin |

### Document Types (`/api/DocumentTypes`)
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/DocumentTypes` | Public |
| GET | `/api/DocumentTypes/{id}` | Public |
| POST | `/api/DocumentTypes` | Admin |
| PUT | `/api/DocumentTypes/{id}` | Admin |
| DELETE | `/api/DocumentTypes/{id}` | Admin |

### Document Requirements (`/api/DocumentRequirements`)
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/DocumentRequirements` | Public |
| GET | `/api/DocumentRequirements/{id}` | Public |
| POST | `/api/DocumentRequirements` | Admin |
| PUT | `/api/DocumentRequirements/{id}` | Admin |
| DELETE | `/api/DocumentRequirements/{id}` | Admin |

### Announcements (`/api/Announcements`)
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/Announcements` | Public |
| GET | `/api/Announcements/{id}` | Public |
| POST | `/api/Announcements` | Admin |
| PUT | `/api/Announcements/{id}` | Admin |
| DELETE | `/api/Announcements/{id}` | Admin |

### Seed (`/api/Seed`)
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/Seed/document-types` | Admin |
| DELETE | `/api/Seed/document-types` | Admin |

## Document Request Status Flow
```
Request → InProcess → Approve → Receive → Download
```
- Students can only delete requests in `Request` status
- Admin moves requests through the workflow

## Setup

### Prerequisites
- .NET 10.0 SDK
- SQL Server (LocalDB or Express)

### Installation

1. **Update connection string** in `appsettings.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost\\SQLEXPRESS;Database=DocTrackerDB;Trusted_Connection=True;TrustServerCertificate=True"
  },
  "Jwt": {
    "Key": "YourSuperSecretKeyThatIsAtLeast32CharactersLong!",
    "Issuer": "DoctrackAPI",
    "Audience": "DoctrackClient"
  }
}
```

2. **Run migrations**:
```bash
dotnet ef database update
```

3. **Run the application**:
```bash
dotnet run
```

API available at: `http://localhost:5097`  
Swagger UI at: `http://localhost:5097/swagger`

