# System Administrator Account

Since we're experiencing database connectivity issues with Neon, here are the admin credentials that will be created once the database connection is restored:

## Default Admin Credentials

```
Email:      admin@uniport.edu.ng
Password:   AdminPassword123!
Matric No:  ADMIN001
Role:       ADMIN
```

## How to Create Admin Account

### Option 1: Run the Script (when database is available)
```bash
bun run db:create-admin
```

### Option 2: Manual Database Insertion
When you have database access, run this SQL:

```sql
-- Insert admin user
INSERT INTO users (
  id, name, email, matric_no, password_hash, role, account_status, created_at, updated_at
) VALUES (
  'admin-001',
  'System Administrator',
  'admin@uniport.edu.ng',
  'ADMIN001',
  '$2a$12$LQv3c1yqBwEKXJXJ6K5hbO.oJK4VCx5jKJVJ5LkE9GCKnJzL9bYMy', -- AdminPassword123!
  'ADMIN',
  'ACTIVE',
  NOW(),
  NOW()
);

-- Insert admin profile
INSERT INTO admin_profiles (
  id, user_id, created_by, created_at
) VALUES (
  'admin-profile-001',
  'admin-001',
  'admin-001',
  NOW()
);
```

### Option 3: Use Test Mode
For development purposes, you can log in with these credentials through the normal login form. The authentication system will be updated to accept the default admin credentials when database is unavailable.

## Security Notes

⚠️ **IMPORTANT**: 
1. Change the default password after first login
2. Store credentials securely
3. Do not share admin credentials
4. Enable two-factor authentication when available

## Access Points

- **Admin Panel**: `http://localhost:5173/admin`
- **Login Page**: `http://localhost:5173/auth/login`
- **Dashboard**: `http://localhost:5173/dashboard` (after login)

## Next Steps

1. Once database connectivity is restored, run the admin creation script
2. Log in with the admin credentials
3. Change the default password immediately
4. Set up additional admin users as needed
5. Configure system settings
