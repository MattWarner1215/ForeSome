const { execSync } = require('child_process');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

console.log('🚀 Setting up chat database tables...\n');

// Check if DATABASE_URL exists
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables.');
  console.error('   Please ensure .env.local contains the DATABASE_URL.');
  process.exit(1);
}

console.log('✅ Found DATABASE_URL');
console.log('📋 Database:', process.env.DATABASE_URL.split('@')[1]?.split('/')[0] || 'Unknown');

try {
  console.log('\n🔄 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma client generated');

  console.log('\n🔄 Pushing database schema (this may take a moment)...');
  execSync('npx prisma db push --accept-data-loss', { 
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL }
  });
  console.log('✅ Database schema updated');

  console.log('\n🎉 Chat database setup complete!');
  console.log('📋 New tables created:');
  console.log('   • ChatRoom (stores chat rooms for each match)');
  console.log('   • ChatMessage (stores individual messages)');
  console.log('\n💬 You can now use the real-time chat feature in your matches!');

} catch (error) {
  console.error('\n❌ Error during setup:', error.message);
  console.error('\n🔧 Troubleshooting:');
  console.error('   1. Check your database connection string');
  console.error('   2. Ensure your database is accessible');
  console.error('   3. Verify you have write permissions to the database');
  
  if (error.message.includes('Authentication failed')) {
    console.error('\n🔑 Database authentication issue:');
    console.error('   • Check your database username and password');
    console.error('   • Verify the database server is running');
  }
  
  process.exit(1);
}