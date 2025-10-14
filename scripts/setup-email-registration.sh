#!/bin/bash

# Setup EmailRegistration table in database
# This script ensures the EmailRegistration table exists

echo "🔧 Setting up EmailRegistration table..."

# Load environment variables
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
fi

# Generate Prisma client
echo "📦 Generating Prisma client..."
npx prisma generate

# Push schema to database
echo "🚀 Pushing schema to database..."
npx prisma db push

echo "✅ EmailRegistration table is ready!"
echo ""
echo "📊 To view registered emails, run:"
echo "   npx prisma studio"
echo ""
echo "   Then navigate to the EmailRegistration table"
