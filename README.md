# University of Port Harcourt Hostel Allocation System (HASmakin)

A modern, automated hostel allocation system built for the University of Port Harcourt, designed to improve fairness, transparency, and efficiency in student accommodation management.

---

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Getting Started](#-getting-started)
- [Database Setup](#-database-setup)
- [Environment Variables](#-environment-variables)
- [Deployment](#-deployment)
- [User Guide](#-user-guide)
- [Admin Guide](#-admin-guide)
- [Development Methodology](#-development-methodology)
- [Security](#-security)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Project Overview

**Project Title:** Hostel Allocation System (HASmakin)  
**Developer:** Giddel Wilson  
**Institution:** University of Port Harcourt  
**Department:** Computer Science  

This system automates the hostel allocation process, replacing manual queues with a fair, transparent, and efficient digital system. It provides a complete end-to-end solution for managing student accommodation applications, payments, and room assignments.

### Problem Statement

Traditional hostel allocation at universities faces several challenges:
- Long physical queues and manual processing
- Lack of transparency in allocation decisions
- Difficulty in managing multiple hostel preferences
- Manual payment verification and tracking
- No centralized system for tracking application status
- Administrative overhead in managing allocations

### Solution

HASmakin provides:
- **Digital Application System**: Students apply online with preference ranking
- **Automated Allocation**: Fair algorithm assigns rooms based on multiple criteria
- **Payment Integration**: Secure payment processing and verification
- **Real-time Tracking**: Students can monitor application status
- **Admin Dashboard**: Comprehensive management tools for administrators
- **Data Analytics**: Statistics and reporting for decision-making

---

## ✨ Features

### Student Features

#### Authentication & Profile Management
- User registration with university matriculation number
- Secure login with JWT authentication
- Profile management with personal and guardian information
- Academic level tracking (Year 1-5)

#### Application System
- Multi-step application form
- Hostel preference ranking (up to 3 choices)
- Special accommodation needs tracking
- Medical conditions documentation
- Roommate preference system
- Application status tracking

#### Payment System
- Secure payment processing
- Multiple payment methods supported
- Payment verification
- Payment history and receipts
- Refund tracking

#### Allocation Management
- Room assignment notifications
- Allocation details (hostel, room number, bed number)
- Allocation confirmation
- Allocation history

### Admin Features

#### Dashboard Overview
- Real-time statistics
  - Total applications (pending, approved, rejected)
  - Bed availability and occupancy rates
  - Payment status overview
- Recent applications feed
- Quick action buttons

#### Application Management
- View all applications with filtering
  - By status (pending, approved, rejected)
  - By academic level
  - By gender
  - By hostel preference
- Search by student name or matric number
- Bulk operations support
- Application approval/rejection with reasons
- Special needs flagging

#### Hostel Management
- Add/edit/delete hostels
- Manage hostel details
  - Name and location
  - Gender (Male, Female, Mixed)
  - Total capacity
  - Available beds
- Room management
  - Room numbers and capacities
  - Bed assignments
- Hostel activation/deactivation

#### Allocation System
- Automated allocation algorithm
  - Considers student preferences
  - Respects gender restrictions
  - Handles special needs
  - Processes roommate requests
- Manual allocation overrides
- Allocation confirmation tracking
- Deallocation and reallocation
- Export allocation reports (CSV)

#### Payment Management
- View all payments with filtering
  - By status (pending, completed, failed, refunded)
  - By date range
  - By payment method
- Payment confirmation
- Payment rejection with reasons
- Refund processing
- Financial reporting
  - Period-based reports (today, week, month, all time)
  - Payment method breakdown
  - Hostel-based revenue analysis
  - PDF export functionality

#### User Management
- View all registered users
- Filter by role (student, admin)
- User account management
- Admission year bulk updates

#### System Settings
- Application deadline configuration
- Payment deadline configuration
- System-wide announcements
- Email configuration
- Payment gateway settings

---

## 🛠 Tech Stack

### Frontend
- **SvelteKit 2.x** - Full-stack web framework
- **Tailwind CSS 3.x** - Utility-first CSS framework
- **TypeScript 5.x** - Type-safe development
- **Svelte 5** - Reactive UI components

### Backend
- **SvelteKit API Routes** - Server-side endpoints
- **Prisma ORM 6.x** - Database ORM with type safety
- **JWT (jsonwebtoken)** - Authentication tokens
- **bcrypt** - Password hashing

### Database
- **MongoDB** - NoSQL database
- Hosted on MongoDB Atlas

### Payment Integration
- **Paystack API** - Nigerian payment gateway
- Webhook support for real-time updates

### Development Tools
- **Bun** - Fast JavaScript runtime and package manager
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Playwright** - End-to-end testing

### Hosting & Deployment
- **Vercel** - Frontend and API hosting
- **MongoDB Atlas** - Database hosting
- **GitHub** - Version control

---

## 🏗 System Architecture

### Database Schema

#### Core Models

**User**
- Authentication (matricNo, email, password)
- Personal info (name, phone, address)
- Academic info (level, admissionYear)
- Guardian info (name, phone, address)
- Demographic info (nationality, state, religion, dateOfBirth, gender)
- Role (STUDENT, ADMIN)

**Application**
- User reference
- Academic level and gender
- Hostel preferences (array of hostel IDs)
- Special needs and medical conditions
- Roommate request
- Application status (PENDING, APPROVED, REJECTED)
- Timestamps

**Hostel**
- Name and location
- Gender restriction (MALE, FEMALE, MIXED)
- Total beds and available beds
- Active status
- Rooms (one-to-many)

**Room**
- Hostel reference
- Room number and capacity
- Occupied count
- Allocations (one-to-many)

**Allocation**
- User, application, and room references
- Status (PENDING, ALLOCATED, CONFIRMED)
- Timestamps (allocated, confirmed, expires)

**Payment**
- User and application references
- Amount and payment method
- Paystack reference
- Transaction ID
- Status (PENDING, COMPLETED, FAILED, REFUNDED)
- Activity log
- Timestamps

**SystemSettings**
- Application deadlines (start, end)
- Payment deadlines (start, end)
- Notification settings
- Payment gateway configuration

### Authentication Flow

1. **Registration**
   - Student submits registration form
   - Password is hashed with bcrypt
   - User account created with STUDENT role
   - Welcome email sent (optional)

2. **Login**
   - User submits credentials
   - Password verified with bcrypt
   - JWT access token generated (30 min expiry)
   - JWT refresh token generated (7 day expiry)
   - Tokens stored in HTTP-only cookies

3. **Authorization**
   - Middleware extracts JWT from cookie or header
   - Token verified and user data attached to request
   - Role-based access control enforced
   - Protected routes check for authentication

4. **Token Refresh**
   - Client sends refresh token
   - New access token generated
   - Refresh token rotated for security

### Allocation Algorithm

The allocation system uses a priority-based algorithm:

1. **Eligibility Check**
   - Application status: APPROVED
   - Payment status: COMPLETED
   - No existing allocation

2. **Preference Matching**
   - Iterate through student preferences (1st, 2nd, 3rd choice)
   - Check hostel availability
   - Verify gender restrictions
   - Check room capacity

3. **Special Considerations**
   - Special needs flagged for admin review
   - Roommate requests processed together
   - Medical conditions documented

4. **Assignment**
   - Allocate to first available preferred hostel
   - Assign specific room and bed
   - Create allocation record
   - Update room occupancy
   - Send notification to student

5. **Fallback**
   - If no preferences available, no allocation made
   - Student notified to update preferences or apply for next cycle

---

## 🚀 Getting Started

### Prerequisites

- **Bun** >= 1.0.0 (or Node.js >= 18.0.0)
- **MongoDB** (local or Atlas)
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Giddel-Wilson/Hasmakin.git
   cd Hasmakin
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration (see [Environment Variables](#-environment-variables))

4. **Set up the database**
   ```bash
   # Generate Prisma Client
   bunx prisma generate

   # Run migrations
   bunx prisma db push

   # Seed the database (optional)
   bun run db:seed
   ```

5. **Create an admin account**
   ```bash
   bun run db:create-admin
   ```

6. **Start the development server**
   ```bash
   bun run dev
   ```

7. **Open your browser**
   ```
   http://localhost:5173
   ```

### Build for Production

```bash
bun run build
bun run preview
```

---

## 💾 Database Setup

### MongoDB Atlas Setup

1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Set up database user with password
4. Whitelist your IP address (or use 0.0.0.0/0 for development)
5. Get your connection string
6. Add to `.env` as `DATABASE_URL`

### Prisma Schema

The database schema is defined in `prisma/schema.prisma`. Key models:

- **Users**: Student and admin accounts
- **Applications**: Hostel applications with preferences
- **Hostels**: Hostel buildings and details
- **Rooms**: Individual rooms within hostels
- **Allocations**: Room assignments to students
- **Payments**: Payment records and transactions
- **SystemSettings**: Application-wide configuration

### Database Commands

```bash
# Generate Prisma Client
bunx prisma generate

# Push schema changes to database
bunx prisma db push

# Open Prisma Studio (Database GUI)
bunx prisma studio

# Reset database (WARNING: Deletes all data)
bunx prisma migrate reset

# Seed database with sample data
bun run db:seed
```

---

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/hasmakin?retryWrites=true&w=majority"

# JWT Secrets (Generate with: openssl rand -base64 32)
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-here"

# Paystack (Get from https://dashboard.paystack.com/#/settings/developer)
PAYSTACK_SECRET_KEY="sk_test_your_secret_key_here"
PAYSTACK_PUBLIC_KEY="pk_test_your_public_key_here"

# Email (Optional - for notifications)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="noreply@uniport.edu.ng"

# Application
PUBLIC_APP_URL="http://localhost:5173"
NODE_ENV="development"
```

### Security Notes

- Never commit `.env` file to version control
- Use strong, randomly generated secrets for JWT
- Rotate secrets periodically in production
- Use different secrets for development and production
- Store production secrets in Vercel environment variables

---

## 🌐 Deployment

### Vercel Deployment

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Set Environment Variables**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add all variables from `.env`
   - Click "Save"

5. **Redeploy**
   ```bash
   vercel --prod
   ```

### Environment Variables in Vercel

Add these in the Vercel dashboard:
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `PAYSTACK_SECRET_KEY`
- `PAYSTACK_PUBLIC_KEY`
- `PUBLIC_APP_URL` (your vercel URL)
- `NODE_ENV=production`

### MongoDB Atlas Production Setup

1. Create production cluster
2. Enable backup
3. Set up proper access controls
4. Use connection string pooling
5. Monitor performance

---

## 📖 User Guide

### For Students

#### Registration
1. Go to `/auth/register`
2. Fill in your details:
   - Full name
   - Matriculation number (e.g., U2021/5570004)
   - Email address
   - Password (min 8 characters)
3. Click "Register"
4. Login with your credentials

#### Applying for Hostel
1. Login to your dashboard
2. Click "Apply for Hostel"
3. Fill in the application form:
   - Academic level
   - Gender
   - Select 3 hostel preferences (in order of preference)
   - Special accommodation needs (optional)
   - Medical conditions (optional)
   - Roommate request (optional - enter matric number)
4. Review and submit

#### Making Payment
1. Go to "Payments" section
2. View payment details
3. Click "Make Payment"
4. Complete payment via Paystack
5. Payment will be verified automatically

#### Checking Status
1. Go to "Status" page
2. View your application status:
   - **Pending**: Under review
   - **Approved**: Approved, awaiting payment
   - **Rejected**: Not approved (with reason)
3. View payment status
4. View allocation details (if allocated)

---

## 👨‍💼 Admin Guide

### Admin Access

**Default Credentials:**
- Matric No: `ADMIN001`
- Password: `AdminPassword123!`

**Change password immediately after first login!**

### Managing Applications

1. Go to `/admin/applications`
2. Use filters to find applications:
   - By status
   - By academic level
   - By hostel preference
   - Search by name/matric number
3. Review application details including special needs
4. Approve or reject applications
5. Export data as CSV

### Managing Payments

1. Go to `/admin/payments`
2. View all payments with status
3. Filter by:
   - Status (pending, completed, failed, refunded)
   - Date range
   - Search by student name/reference
4. Actions:
   - Confirm payment
   - Reject payment (with reason)
   - Process refund
5. Generate financial reports:
   - Select period (today, week, month, all time)
   - View statistics
   - Export as PDF

### Running Allocations

1. Go to `/admin/allocations`
2. View statistics:
   - Total applications
   - Pending allocation
   - Already allocated
   - Available beds
3. Click "Run Allocation"
4. System will:
   - Process all approved applications with completed payments
   - Assign rooms based on preferences
   - Skip students with existing allocations
5. View allocation results
6. Export allocations as CSV

### Managing Hostels

1. Go to `/admin/hostels`
2. View all hostels with capacity
3. Add new hostel:
   - Name
   - Location description
   - Gender (Male, Female, Mixed)
   - Total beds
4. Edit hostel details
5. Activate/deactivate hostels
6. Manage rooms within each hostel

### System Settings

1. Go to `/admin/settings`
2. Configure:
   - Application deadlines (start and end dates)
   - Payment deadlines
   - Email notifications
   - Payment gateway settings
3. Test integrations:
   - Send test email
   - Test payment gateway

---

## 💻 Development Methodology

### Agile Approach

This project follows an Agile development methodology with iterative cycles:

1. **Sprint Planning**: Define features for 2-week sprints
2. **Development**: Build features with continuous integration
3. **Testing**: Test each feature before merging
4. **Review**: Demo to stakeholders
5. **Retrospective**: Improve process

### Development Phases

#### Phase 1: Foundation ✅
- Database schema design
- Authentication system
- Basic UI framework
- Project structure

#### Phase 2: Core Features ✅
- Student application workflow
- Payment integration
- Admin management interface
- Allocation algorithm

#### Phase 3: Enhancement ✅
- Advanced filtering and search
- Financial reporting
- Special needs tracking
- Real-time updates

#### Phase 4: Production 🚀
- Security hardening
- Performance optimization
- Production deployment
- User training

### Code Quality Standards

- **TypeScript**: Strict type checking enabled
- **ESLint**: Code linting for consistency
- **Prettier**: Auto-formatting on save
- **Git Hooks**: Pre-commit checks
- **Code Reviews**: All changes reviewed before merge
- **Documentation**: Inline comments and README updates

---

## 🔒 Security

### Authentication & Authorization

- **Password Security**: Bcrypt with salt rounds (10)
- **JWT Tokens**: Signed with HS256 algorithm
- **Token Expiry**: Access (30 min), Refresh (7 days)
- **HTTP-Only Cookies**: Prevents XSS attacks
- **Role-Based Access**: STUDENT and ADMIN roles
- **Protected Routes**: Middleware authentication checks

### Data Protection

- **Input Validation**: All user inputs validated
- **SQL Injection**: Prisma ORM prevents injection
- **XSS Protection**: Output encoding and sanitization
- **CSRF Protection**: SvelteKit built-in CSRF tokens
- **Secure Headers**: Security headers configured
- **HTTPS Only**: Production uses SSL/TLS

### Payment Security

- **PCI Compliance**: Paystack handles card data
- **No Card Storage**: Never store card details
- **Webhook Verification**: Paystack signature validation
- **Transaction Logging**: All payments logged
- **Refund Controls**: Admin-only refund processing

### Best Practices

1. **Never commit secrets** to version control
2. **Use environment variables** for configuration
3. **Rotate secrets** periodically
4. **Monitor logs** for suspicious activity
5. **Keep dependencies updated** with `bun update`
6. **Enable 2FA** for admin accounts (future feature)
7. **Regular backups** of database
8. **Security audits** before major releases

---

## 🤝 Contributing

### Getting Started

1. Fork the repository
2. Create a feature branch
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Make your changes
4. Test thoroughly
5. Commit with descriptive message
   ```bash
   git commit -m "feat: add new feature description"
   ```
6. Push to your fork
   ```bash
   git push origin feature/your-feature-name
   ```
7. Create a Pull Request

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Test additions or changes
- `chore:` Build process or auxiliary tool changes

### Code Style

- Use TypeScript for all new code
- Follow ESLint rules
- Use Prettier for formatting
- Write meaningful variable names
- Add comments for complex logic
- Keep functions small and focused

---

## 📞 Support

### Issues & Bugs

Report issues on [GitHub Issues](https://github.com/Giddel-Wilson/Hasmakin/issues)

### Contact

- **Developer**: Giddel Wilson
- **Institution**: University of Port Harcourt
- **Repository**: https://github.com/Giddel-Wilson/Hasmakin

---

## 📄 License

This project is developed as a final year project for the University of Port Harcourt.  
All rights reserved © 2025

---

## 🙏 Acknowledgments

- **University of Port Harcourt** - For project support
- **Department of Computer Science** - For guidance and resources
- **SvelteKit Team** - For excellent documentation
- **Prisma Team** - For powerful ORM tools
- **Paystack** - For payment integration support

---

## 🗺 Roadmap

### Future Enhancements

- [ ] Mobile application (React Native)
- [ ] Email notifications for status changes
- [ ] SMS notifications via Twilio
- [ ] Advanced analytics dashboard
- [ ] Machine learning for allocation optimization
- [ ] Student feedback system
- [ ] Maintenance request system
- [ ] Visitor management
- [ ] QR code room access
- [ ] Integration with university portal

---

**Built with ❤️ for University of Port Harcourt**
