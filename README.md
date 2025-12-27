# Backend Folder Structure

```text
backend/
├── dist/                                   # Compiled JavaScript output
├── docs/
│   ├── socket/
│   │   ├── admin.md                        # Admin socket events documentation
│   │   ├── telecaller.md                   # Telecaller socket events documentation
│   │   └── user.md                         # User socket events documentation
│   ├── admin.md                            # Admin REST API endpoints documentation
│   ├── auth.md                             # Authentication REST API endpoints documentation
│   ├── callFlow.md                         # End-to-end call workflow and state management
│   ├── README.md                           # Documentation index and overview
│   ├── telecaller.md                       # Telecaller REST API endpoints documentation
│   └── users.md                            # User REST API endpoints documentation
│
├── node_modules/                           # Dependencies
├── src/
│   ├── api/                                # API modules (feature-based architecture)
│   │   ├── admin/
│   │   │   ├── admin.controller.ts         # Admin request handlers
│   │   │   ├── admin.repository.ts         # Admin database operations
│   │   │   ├── admin.router.ts             # Admin route definitions
│   │   │   ├── admin.service.ts            # Admin business logic
│   │   │   └── admin.types.ts              # Admin-specific types
│   │   ├── auth/
│   │   │   ├── auth.controller.ts          # Auth request handlers (login, OTP)
│   │   │   ├── auth.repository.ts          # Auth database operations
│   │   │   ├── auth.router.ts              # Auth route definitions
│   │   │   ├── auth.service.ts             # Auth business logic
│   │   │   └── auth.types.ts               # Auth-specific types
│   │   ├── telecaller/
│   │   │   ├── telecaller.controller.ts    # Telecaller request handlers
│   │   │   ├── telecaller.repository.ts    # Telecaller database operations
│   │   │   ├── telecaller.router.ts        # Telecaller route definitions
│   │   │   ├── telecaller.service.ts       # Telecaller business logic
│   │   │   └── telecaller.types.ts         # Telecaller-specific types
│   │   └── users/
│   │       ├── user.controller.ts          # User request handlers
│   │       ├── user.repository.ts          # User database operations
│   │       ├── user.router.ts              # User route definitions
│   │       ├── user.service.ts             # User business logic
│   │       └── user.types.ts               # User-specific types
│   ├── config/
│   │   ├── cors.config.ts                  # CORS configuration
│   │   ├── redis.config.ts                 # CRedis connection setup
│   │   └── DB.config.ts                    # Database connection setup
│   ├── constants/
│   │   └── language.ts                     # Language constants
│   ├── middleware/
│   │   ├── errors/
│   │   │   └── ApiError.ts                 # Custom API error class
│   │   ├── validation/
│   │   │   ├── admin.validation.ts         # Admin request validation schemas
│   │   │   ├── auth.validation.ts          # Auth request validation schemas
│   │   │   ├── telecaller.validation.ts    # Telecaller request validation schemas
│   │   │   └── user.validation.ts          # User request validation schemas
│   │   ├── error.handler.ts                # Global error handling middleware
│   │   └── rateLimiter.ts                  # Rate limiting for socket/calls and auth routes
│   │   └── validation.middleware.ts        # Request validation middleware
│   ├── models/
│   │   ├── admin.model.ts                  # Admin MongoDB schema
│   │   ├── call.model.ts                   # Call history MongoDB schema
│   │   ├── otp.model.ts                    # OTP MongoDB schema
│   │   ├── plan.model.ts                   # Recharge plan MongoDB schema
│   │   ├── report.model.ts                 # Report MongoDB schema
│   │   ├── transaction.model.ts            # Transaction MongoDB schema
│   │   └── user.model.ts                   # User MongoDB schema
│   ├── service/
│   │   └── livekit.service.ts              # LiveKit token generation and destroy room
│   ├── socket/
│   │   ├── middleware/
│   │   │   └── auth.middleware.ts          # Socket authentication middleware
│   │   ├── namespaces/
│   │   │   ├── admin.namespace.ts          # Admin socket namespace (/admin)
│   │   │   ├── telecaller.namespace.ts     # Telecaller socket namespace (/telecaller)
│   │   │   └── user.namespace.ts           # User socket namespace (/user)
│   │   ├── services/
│   │   │   ├── call.service.ts             # Call handling socket service
│   │   │   └── presence.service.ts         # Online presence socket service
│   │   ├── types/
│   │   │   ├── admin.events.ts             # Admin socket event types
│   │   │   ├── telecaller.events.ts        # Telecaller socket event types
│   │   │   └── user.events.ts              # User socket event types
│   │   └── index.ts                        # Socket.IO initialization
│   ├── types/                      
│   │   │   ├── admin.d.ts                  # Admin type declarations
│   │   │   ├── general.d.ts                # General/shared type declarations
│   │   │   ├── telecaller.d.ts             # Telecaller type declarations
│   │   │   └── user.d.ts                   # User type declarations
│   ├── utils/
│   │   ├── baseController.ts               # Base controller with common methods
│   │   ├── jwt.ts                          # JWT token utilities
│   │   ├── guards.ts                       # helper to check is the account is User or Telecaller
│   │   └── generator.ts                    # ID/code generator utilities
│   ├── app.ts                              # Express app configuration
│   └── server.ts                           # Server entry point
├── .env                                    # Environment variables
├── .gitignore                              # Git ignore rules
├── nodemon.json                            # Nodemon configuration
├── package.json                            # Dependencies & scripts
├── package-lock.json                       # Dependency lock file
├── README.md                               # Redme file for easy reference
└── tsconfig.json                           # TypeScript configuration
```
