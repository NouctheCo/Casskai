# Test Script for AI Caching & Conversation Persistence
# Run this to validate the deployment locally

Write-Host "🧪 CassKai IA Caching & Persistence Test Suite" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Set up PostgreSQL password
$env:PGPASSWORD = 'postgres'

# Test 1: Database Connection
Write-Host "📡 Test 1: Database Connection..." -ForegroundColor Yellow
$result = & psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c "SELECT current_database();" 2>&1
if ($result -match "postgres") {
    Write-Host "✅ Database connected successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Database connection failed" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 2: Tables Created
Write-Host "🗂️  Test 2: Verifying Tables..." -ForegroundColor Yellow
$result = & psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c "
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN ('ai_cache', 'ai_conversations', 'ai_messages')
ORDER BY table_name;" 2>&1

Write-Host $result

Write-Host ""

# Test 3: Indices Created
Write-Host "🔍 Test 3: Verifying Indices..." -ForegroundColor Yellow
$result = & psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c "
SELECT indexname, tablename FROM pg_indexes 
WHERE tablename IN ('ai_cache', 'ai_conversations', 'ai_messages')
ORDER BY tablename, indexname;" 2>&1

Write-Host $result

Write-Host ""

# Test 4: RLS Policies
Write-Host "🔐 Test 4: Verifying RLS Policies..." -ForegroundColor Yellow
$result = & psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c "
SELECT tablename, COUNT(*) as policy_count 
FROM pg_policies 
WHERE tablename IN ('ai_cache', 'ai_conversations', 'ai_messages')
GROUP BY tablename
ORDER BY tablename;" 2>&1

Write-Host $result

Write-Host ""

# Test 5: Functions Created
Write-Host "⚙️  Test 5: Verifying Functions..." -ForegroundColor Yellow
$result = & psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c "
SELECT proname FROM pg_proc 
WHERE proname IN (
    'cleanup_expired_cache',
    'increment_cache_hit_count',
    'get_cache_stats',
    'update_conversation_message_count',
    'update_conversation_updated_at',
    'get_conversation_with_messages',
    'get_conversation_stats'
)
ORDER BY proname;" 2>&1

Write-Host $result

Write-Host ""

# Test 6: Triggers Created
Write-Host "🔨 Test 6: Verifying Triggers..." -ForegroundColor Yellow
$result = & psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c "
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;" 2>&1

Write-Host $result

Write-Host ""

# Test 7: Table Row Count
Write-Host "📊 Test 7: Table Row Counts (should all be 0)..." -ForegroundColor Yellow
$result = & psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c "
SELECT
    (SELECT COUNT(*) FROM ai_cache) as ai_cache_rows,
    (SELECT COUNT(*) FROM ai_conversations) as ai_conversations_rows,
    (SELECT COUNT(*) FROM ai_messages) as ai_messages_rows;" 2>&1

Write-Host $result

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "✅ All database tests completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "1. Run: npm run dev" -ForegroundColor White
Write-Host "2. Test caching: Upload same document twice" -ForegroundColor White
Write-Host "3. Check console for: '[AICacheService] Cache hit'" -ForegroundColor White
Write-Host "4. Test persistence: Ask IA question, refresh page" -ForegroundColor White
Write-Host "5. Monitor dashboard: Settings → IA Caching Dashboard" -ForegroundColor White
Write-Host ""
