# Auth Service Documentation

The Auth Service manages user accounts, password security, and authentication tokens.

## User Entity
The system supports four user roles:
- `CLIENT`
- `GYM_OWNER`
- `GYM_STAFF`
- `ADMIN`

## Authentication Logic
- **Password Hashing**: Uses `bcryptjs` with a salt round of 10 to secure user passwords before storage.
- **JWT Implementation**: Once authenticated, the service issues a JSON Web Token (JWT) with a 60-minute expiration.
- **Payload**: The JWT payload includes the user's email, ID (`sub`), and role.

## API Endpoints
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/auth/register` | Creates a new user account. |
| POST | `/auth/login` | Validates credentials and returns a JWT. |