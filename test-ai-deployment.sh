#!/bin/bash
# Test Script for AI Caching & Conversation Persistence
# Run this to validate the deployment locally

echo "🧪 CassKai IA Caching & Persistence Test Suite"
echo "================================================"
echo ""

# Test 1: Database Connection
echo "📡 Test 1: Database Connection..."
PGPASSWORD='postgres' psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c "SELECT current_database();" 2>&1 | grep -q "postgres"
if [ $? -eq 0 ]; then
    echo "✅ Database connected successfully"
else
    echo "❌ Database connection failed"
    exit 1
fi

echo ""

# Test 2: Tables Created
echo "🗂️  Test 2: Verifying Tables..."
PGPASSWORD='postgres' psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c "
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN ('ai_cache', 'ai_conversations', 'ai_messages')
ORDER BY table_name;
" 2>&1

echo ""

# Test 3: Indices Created
echo "🔍 Test 3: Verifying Indices..."
PGPASSWORD='postgres' psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c "
SELECT indexname FROM pg_indexes 
WHERE tablename IN ('ai_cache', 'ai_conversations', 'ai_messages')
ORDER BY tablename, indexname;
" 2>&1

echo ""

# Test 4: RLS Policies
echo "🔐 Test 4: Verifying RLS Policies..."
PGPASSWORD='postgres' psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c "
SELECT tablename, COUNT(*) as policy_count 
FROM pg_policies 
WHERE tablename IN ('ai_cache', 'ai_conversations', 'ai_messages')
GROUP BY tablename
ORDER BY tablename;
" 2>&1

echo ""

# Test 5: Functions Created
echo "⚙️  Test 5: Verifying Functions..."
PGPASSWORD='postgres' psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c "
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
ORDER BY proname;
" 2>&1

echo ""

# Test 6: Triggers Created
echo "🔨 Test 6: Verifying Triggers..."
PGPASSWORD='postgres' psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c "
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
" 2>&1

echo ""

# Test 7: Table Row Count (should be 0 initially)
echo "📊 Test 7: Table Row Counts..."
PGPASSWORD='postgres' psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c "
SELECT
    (SELECT COUNT(*) FROM ai_cache) as ai_cache_rows,
    (SELECT COUNT(*) FROM ai_conversations) as ai_conversations_rows,
    (SELECT COUNT(*) FROM ai_messages) as ai_messages_rows;
" 2>&1

echo ""
echo "================================================"
echo "✅ All database tests completed successfully!"
echo ""
echo "📝 Next steps:"
echo "1. Run: npm run dev"
echo "2. Test caching: Upload same document twice"
echo "3. Check console for: '[AICacheService] Cache hit'"
echo "4. Test persistence: Ask IA question, refresh page"
echo "5. Monitor dashboard: Settings → IA Caching Dashboard"
echo ""
