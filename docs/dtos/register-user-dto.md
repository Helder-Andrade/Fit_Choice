## RegisterUserDTO
Used for creating new accounts.
- `email`: Required, valid email format.
- `password`: Required.
- `role`: Required, must be a valid `UserRole` (transformed to uppercase).
- `name`: Required string.
- `country_code`: Optional integer.
- `phone_number`: Optional integer.