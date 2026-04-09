#!/bin/sh
set -e

echo "🔄 Running Prisma DB push..."
npx prisma db push --skip-generate

echo "🔧 Fixing Shorts classification..."
node dist/scripts/fix-shorts.js || echo "⚠️ fix-shorts skipped (may not exist yet)"

echo "🚀 Starting server..."
exec node dist/index.js
