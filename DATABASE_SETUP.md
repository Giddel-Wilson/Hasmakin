# Database Setup Instructions
## University of Port Harcourt - Hostel Allocation System

This document provides comprehensive instructions for setting up the database when your Neon PostgreSQL connection is restored.

## 📋 Prerequisites

1. **Database Connection**: Ensure your Neon PostgreSQL database is accessible
2. **Environment Variables**: Verify your `.env` file contains the correct `DATABASE_URL`
3. **Prisma CLI**: Install globally with `npm install -g prisma` or use `bunx prisma`

## 🚀 Database Setup Process

### Step 1: Environment Configuration

Ensure your `.env` file contains:
```bash
DATABASE_URL="postgresql://username:password@ep-empty-lab-a1evg8m3.ap-southeast-1.aws.neon.tech:5432/database?sslmode=require"
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-here"
```

### Step 2: Database Migration

Run Prisma migrations to create tables:
```bash
# Generate Prisma client
bunx prisma generate

# Apply database migrations
bunx prisma migrate deploy

# Or for development (creates migration files)
bunx prisma migrate dev --name init
```

### Step 3: Database Seeding

Populate the database with initial data:
```bash
# Seed the database with sample data
bun run db:seed
```

### Step 4: Create Admin User (Alternative)

If seeding fails, create admin manually:
```bash
# Create admin user only
bun run db:create-admin
```

### Step 5: Reset Database (If Needed)

To completely reset and reseed:
```bash
# Reset and reseed database
bun run db:reset
```

## 📊 What Gets Created

### **Admin Account**
- **Email**: admin@uniport.edu.ng
- **Password**: AdminPassword123!
- **Role**: ADMIN
- **Access**: Full system administration

### **Hostels** (5 Total)
#### Male Hostels:
1. **Mandela Hall** - 480 beds (Premium)
2. **Freedom Hall** - 400 beds (Standard)

#### Female Hostels:
1. **Queens Hall** - 300 beds (Premium)
2. **New Hall (Female)** - 240 beds (Modern)
3. **Amina Hall** - 270 beds (Standard)

### **Sample Students** (4 Total)
1. **Adaora Okafor** (Female, 300L) - adaora.okafor@uniport.edu.ng
2. **Chukwuma Nwosu** (Male, 200L) - chukwuma.nwosu@uniport.edu.ng
3. **Fatima Abdullahi** (Female, 400L) - fatima.abdullahi@uniport.edu.ng
4. **Emmanuel Okoro** (Male, 100L) - emmanuel.okoro@uniport.edu.ng
- **Password**: student123 (for all students)

### **Rooms**
- Automatically generated for each hostel
- Multiple room types: Single, Double, Triple, Quad
- Proper bed capacity calculation

### **System Settings**
- Application deadlines
- Payment amounts
- Allocation parameters
- Feature toggles

## 🔧 Troubleshooting

### Database Connection Issues
```bash
# Test database connection
bunx prisma db push

# View database in browser
bunx prisma studio
```

### Schema Issues
```bash
# Reset Prisma client
bunx prisma generate

# View current schema state
bunx prisma db status
```

### Migration Problems
```bash
# Reset migrations (DESTRUCTIVE)
bunx prisma migrate reset

# Apply specific migration
bunx prisma migrate deploy
```

## 📱 Testing the Setup

### 1. Admin Login
- Navigate to: http://localhost:5174/auth/login
- Email: admin@uniport.edu.ng
- Password: AdminPassword123!
- Should redirect to: http://localhost:5174/admin

### 2. Student Login
- Navigate to: http://localhost:5174/auth/login
- Email: adaora.okafor@uniport.edu.ng
- Password: student123
- Should redirect to student dashboard

### 3. Database Verification
```bash
# Open Prisma Studio to view data
bunx prisma studio
```

## 🚨 Current Fallback Mode

**While your database is unavailable**, the system runs in fallback mode:
- ✅ Admin login works with demo credentials
- ✅ Admin dashboard fully functional
- ✅ All UI components working
- ⚠️ Student registration/login disabled
- ⚠️ Application submission disabled
- ⚠️ Real data storage disabled

## 🔄 Migration from Fallback to Full Database

When your database comes online:

1. **Run Database Setup**:
   ```bash
   bun run db:seed
   ```

2. **Restart Development Server**:
   ```bash
   bun run dev
   ```

3. **Verify Connection**:
   - Admin login should work with both fallback and database
   - Student login should become available
   - All features should be fully functional

## 📞 Support

If you encounter issues:
1. Check database connection in Neon dashboard
2. Verify environment variables
3. Review Prisma logs
4. Ensure firewall allows database connections

## 🎯 Next Development Phases

Once database is operational:
1. **Application Management** - Review/approve student applications
2. **Allocation Engine** - Automated bed allocation algorithms
3. **Payment Integration** - Paystack payment processing
4. **Reporting System** - Analytics and insights
5. **Mobile App** - Student mobile application

---

**Note**: The fallback authentication system ensures continuous development while database issues are resolved. All features will seamlessly transition to full database mode once connectivity is restored.
