#!/bin/bash

# PetGroom Pro - Application Start Script
# This script will:
# 1. Clean used ports (3000)
# 2. Ensure PostgreSQL is running
# 3. Setup the database with migrations
# 4. Seed the database with comprehensive sample data (15+ items per feature)
# 5. Start the application

set -e

echo "=============================================="
echo "   PetGroom Pro - Professional Startup Script"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to kill processes on a specific port
kill_port() {
    local port=$1
    local pids=$(lsof -ti:$port 2>/dev/null)
    if [ -n "$pids" ]; then
        print_warning "Killing processes on port $port: $pids"
        echo $pids | xargs kill -9 2>/dev/null || true
        sleep 1
        print_success "Port $port is now free"
    else
        print_status "Port $port is already free"
    fi
}

# Step 1: Clean used ports
echo ""
echo "Step 1: Cleaning up used ports..."
echo "----------------------------------------"
kill_port 3000

# Step 2: Check/Start PostgreSQL
echo ""
echo "Step 2: Checking PostgreSQL status..."
echo "----------------------------------------"

# Check if PostgreSQL is running
if command -v pg_isready &> /dev/null; then
    if pg_isready -q; then
        print_success "PostgreSQL is running"
    else
        print_warning "PostgreSQL is not running. Attempting to start..."
        if command -v brew &> /dev/null; then
            brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null || true
            sleep 3
        fi
        if pg_isready -q; then
            print_success "PostgreSQL started successfully"
        else
            print_error "Could not start PostgreSQL. Please start it manually."
            echo "  On macOS with Homebrew: brew services start postgresql"
            echo "  On Linux: sudo systemctl start postgresql"
        fi
    fi
else
    print_warning "pg_isready not found. Assuming PostgreSQL is managed separately."
fi

# Step 3: Install dependencies if needed
echo ""
echo "Step 3: Installing dependencies..."
echo "----------------------------------------"
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
    print_status "Installing npm packages..."
    npm install
    print_success "Dependencies installed"
else
    print_status "Dependencies already installed"
fi

# Step 4: Generate Prisma client
echo ""
echo "Step 4: Setting up database..."
echo "----------------------------------------"
print_status "Generating Prisma client..."
npx prisma generate

# Create database if it doesn't exist
print_status "Creating database if needed..."
if command -v createdb &> /dev/null; then
    createdb petgrooming 2>/dev/null || print_status "Database 'petgrooming' already exists"
fi

# Push schema to database
print_status "Pushing schema to database..."
npx prisma db push --accept-data-loss

print_success "Database schema updated"

# Step 5: Seed the database
echo ""
echo "Step 5: Seeding database with sample data..."
echo "----------------------------------------"
print_status "Running comprehensive seed script..."
print_status "This will create 15+ items for every feature:"
echo ""
echo "  Users & Auth:"
echo "    - 1 Admin user"
echo "    - 10 Groomers"
echo "    - 5 Receptionists"
echo ""
echo "  Breeds:"
echo "    - 21 Dog breeds"
echo "    - 11 Cat breeds"
echo ""
echo "  Services & Products:"
echo "    - 24 Grooming services"
echo "    - 21 Retail products"
echo "    - Service packages with discounts"
echo ""
echo "  Clients & Pets:"
echo "    - 20 Clients with full profiles"
echo "    - 32 Pets with health records"
echo ""
echo "  Health & Safety:"
echo "    - 20 Vaccination records"
echo "    - 20 Behavioral notes"
echo "    - 15 Health alerts"
echo "    - 15 Safety incidents"
echo ""
echo "  Appointments & Transactions:"
echo "    - 15+ Appointments"
echo "    - 15+ Grooming sessions"
echo "    - 15+ Transactions"
echo ""
echo "  Loyalty & Rewards:"
echo "    - Gift cards"
echo "    - Loyalty tiers"
echo ""

npm run db:seed

print_success "Database seeded successfully!"

# Step 6: Start the application
echo ""
echo "Step 6: Starting the application..."
echo "----------------------------------------"
print_status "Starting Next.js development server..."
echo ""
echo "=============================================="
echo "        Application is starting!"
echo "=============================================="
echo ""
echo -e "${GREEN}Open your browser and navigate to:${NC}"
echo -e "  ${BLUE}http://localhost:3000${NC}"
echo ""
echo -e "${GREEN}Login with demo credentials:${NC}"
echo -e "  Email:    ${YELLOW}admin@petgroom.com${NC}"
echo -e "  Password: ${YELLOW}password123${NC}"
echo ""
echo -e "${GREEN}Or click 'Use Demo Credentials' button on login page${NC}"
echo ""
echo "=============================================="
echo ""
echo "Features available:"
echo "  - Dashboard with KPIs"
echo "  - Client Management"
echo "  - Pet Profiles & Health Records"
echo "  - Appointment Scheduling"
echo "  - Grooming Session Tracking"
echo "  - Service & Product Management"
echo "  - Point of Sale (POS)"
echo "  - Health & Safety Monitoring"
echo "  - Loyalty Program"
echo "  - Photo Gallery"
echo "  - AI-Powered Features (OpenRouter)"
echo "    - Breed Identification"
echo "    - Style Suggestions"
echo "    - Health Analysis"
echo "    - Social Media Posts"
echo "    - Client Messages"
echo "    - Appointment Estimates"
echo "    - Upsell Recommendations"
echo "    - Photo Enhancement Tips"
echo ""
echo "=============================================="
echo ""

# Start the development server
npm run dev
