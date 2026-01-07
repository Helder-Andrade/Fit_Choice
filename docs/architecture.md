# Project Architecture

The **Fit Choice** project is a NestJS monorepo designed to manage multiple microservices within a single repository.

## Monorepo Structure
The project uses the standard NestJS monorepo structure defined in `nest-cli.json`. It contains all applications:

1.  **portal-backend**: The main entry point and administrative service.
2.  **auth-service**: Dedicated service for identity management, registration, and JWT issuance.
3.  **gym-service**: Handles gym-specific business logic.

## Database Strategy
The project utilizes **PostgreSQL** with **TypeORM**. 
- **authConnection**: A specific TypeORM connection used by the `AuthServiceModule` to manage user data.
- **Configuration**: Environment variables are managed via `ConfigModule`, loading from an `ambient_variables.env` file.