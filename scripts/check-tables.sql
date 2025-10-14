-- Check which tables exist in your database
SELECT table_name, row_security
FROM information_schema.tables t
LEFT JOIN pg_tables pt ON t.table_name = pt.tablename AND pt.schemaname = 'public'
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check if EmailRegistration table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'EmailRegistration'
) as email_registration_exists;
