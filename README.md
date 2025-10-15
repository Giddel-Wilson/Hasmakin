# University of Port Harcourt Hostel Allocation System

A modern, automated hostel allocation system built for the University of Port Harcourt, designed to improve fairness, transparency, and efficiency in student accommodation management.

## 🎯 Project Overview

**Project Title:** Hostel Allocation System  
**Student:** Ademakin Angel Oluwapelumi (U2021/5570062)  
**Institution:** Department of Computer Science, Faculty of Computing, University of Port Harcourt  
**Submission:** August 2025  

This final-year project automates the hostel allocation process, replacing manual queues with a fair, transparent, and efficient digital system that includes predictive analytics for demand forecasting.

## 🛠 Tech Stack

### Frontend
- **SvelteKit** - Modern web framework for the user interface
- **Shadcn UI** - Component library for consistent design
- **Tailwind CSS** - Responsive styling and university branding
- **TypeScript** - Type-safe development

### Backend
- **SvelteKit API Routes** - Server-side API endpoints
- **Prisma ORM** - Database modeling and queries
- **JWT** - Secure authentication and authorization

### Database
- **Neon PostgreSQL** - Scalable serverless database
- **Comprehensive schema** - Users, applications, hostels, rooms, allocations, payments

### Payment Integration
- **Paystack API** - Secure payment verification system

### Machine Learning
- **Brain.js** - Lightweight ML for hostel demand forecasting

### Hosting
- **Vercel** - Deployment platform for both frontend and backend

## 🏗 System Architecture

### User Roles

#### Students
- Register/login with university credentials
- Submit hostel applications with preferences
- Make secure payments via Paystack
- Track application status in real-time
- Confirm room allocations

#### Administrators
- Secure dashboard access (admin-only creation)
- Manage hostel and room inventory
- Configure allocation criteria
- Run automated allocation engine
- Generate reports and analytics
- Manage user accounts and applications

## 📊 Database Schema

The system uses a comprehensive PostgreSQL schema with the following key models:

- **Users** - Student and admin account management
- **Applications** - Hostel application submissions
- **Hostels** - Accommodation facility information
- **Rooms** - Individual room management
- **Allocations** - Room assignment tracking
- **Payments** - Paystack payment records
- **AuditLogs** - System activity monitoring
- **HistoricalData** - ML training data

## 🔐 Authentication & Security

- **JWT-based authentication** with role separation
- **Password hashing** using bcryptjs with salt rounds
- **Rate limiting** for API endpoints
- **Input validation** and sanitization
- **University email verification** for student registration
- **Audit logging** for all system activities

## 🎨 UI/UX Design

### Design System
- **University Colors:** Navy Blue (#1E298A), Gold (#FACC15), Emerald (#10B981)
- **Typography:** Poppins for headings, Inter for body text
- **Mobile-first responsive design**
- **Accessibility considerations**

### Student Interface
- Clean, intuitive dashboard
- Step-by-step application process
- Real-time status updates
- Payment integration

### Admin Interface
- Comprehensive management dashboard
- Data visualization and reporting
- Allocation management tools
- User administration

## 🚀 Key Features

### Core Functionality
- ✅ **User Registration & Authentication**
- ✅ **Role-based Access Control**
- ✅ **Student Dashboard**
- ✅ **University Branding & Design**
- 🚧 **Hostel Application System**
- 🚧 **Paystack Payment Integration**
- 🚧 **Automated Allocation Engine**
- 🚧 **Admin Dashboard**
- 🚧 **Predictive Analytics**

### Advanced Features
- Real-time notifications
- Allocation algorithm based on:
  - Academic level priority
  - Payment verification
  - Gender-specific hostels
  - Special needs accommodation
- Historical data analysis
- Demand forecasting using Brain.js
- Comprehensive reporting system

## 📁 Project Structure

```
src/
├── lib/
│   ├── components/ui/          # Shadcn UI components
│   └── server/
│       ├── auth.ts            # Authentication utilities
│       └── database.ts        # Database configuration
├── routes/
│   ├── auth/                  # Authentication pages
│   ├── dashboard/             # Student dashboard
│   ├── admin/                 # Admin interface
│   └── api/                   # API endpoints
│       ├── auth/              # Authentication APIs
│       └── student/           # Student APIs
└── app.css                    # University styling

prisma/
└── schema.prisma              # Database schema

.env                           # Environment variables
```

## 🔧 Installation & Setup

### Prerequisites
- Node.js 18+ or Bun
- PostgreSQL database (Neon recommended)
- Paystack account for payments

### Development Setup

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd HASmakin
   bun install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Database Setup**
   ```bash
   bunx prisma generate
   bunx prisma migrate dev
   ```

4. **Start Development Server**
   ```bash
   bun dev
   ```

### Production Deployment

1. **Database Migration**
   ```bash
   bunx prisma migrate deploy
   ```

2. **Build Application**
   ```bash
   bun run build
   ```

3. **Deploy to Vercel**
   ```bash
   vercel deploy
   ```

## 🔐 Environment Variables

```env
DATABASE_URL="postgresql://..."
JWT_SECRET="your-jwt-secret"
JWT_REFRESH_SECRET="your-refresh-secret"
PAYSTACK_SECRET_KEY="sk_test_..."
PAYSTACK_PUBLIC_KEY="pk_test_..."
NODE_ENV="development"
PORT=3001
FRONTEND_URL="http://localhost:5173"
```

## 🧪 Testing

### Unit Tests
```bash
bun test
```

### E2E Tests
```bash
bun run test:e2e
```

## 📈 Current Progress

- ✅ **Database Schema & Models** (100%)
- ✅ **Authentication System** (100%)
- ✅ **Landing Page** (100%)
- ✅ **Student Registration/Login** (100%)
- ✅ **Student Dashboard Layout** (100%)
- 🚧 **API Endpoints** (60%)
- 🚧 **Admin Interface** (0%)
- 🚧 **Payment Integration** (0%)
- 🚧 **Allocation Engine** (0%)
- 🚧 **Predictive Analytics** (0%)

## 🔜 Next Steps

1. **Complete Student Application Flow**
   - Hostel application form
   - Payment integration
   - Status tracking

2. **Build Admin Interface**
   - Dashboard with analytics
   - User management
   - Allocation controls

3. **Implement Core Algorithms**
   - Automated allocation engine
   - Predictive analytics with Brain.js

4. **Testing & Optimization**
   - End-to-end testing
   - Performance optimization
   - Security audit

5. **Documentation & Deployment**
   - Complete documentation
   - Production deployment
   - User training materials

## 📄 Academic Documentation

- **README.md** - Project overview and setup
- **METHODOLOGY.md** - Development methodology and design decisions
- **REPORT.md** - Academic project report structure

## 👨‍💻 Developer

**Ademakin Angel Oluwapelumi**  
Matric No: U2021/5570062  
Department of Computer Science  
University of Port Harcourt  

---

*This project represents a comprehensive solution to modernize hostel allocation at the University of Port Harcourt, demonstrating the practical application of modern web technologies in solving real-world university administration challenges.*
