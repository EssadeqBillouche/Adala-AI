#!/usr/bin/env bash
# =============================================================================
# Quick test script for AdalaAI Engine
# Tests health endpoints and makes a sample query
# =============================================================================

AI_ENGINE="${AI_ENGINE_URL:-http://localhost:8000}"
QDRANT="${QDRANT_URL:-http://localhost:6333}"
TENANT_ID="${TENANT_ID:-test_tenant}"

echo "============================================"
echo "  AdalaAI Engine - Quick Test"
echo "============================================"
echo ""

# 1. Health check
echo "1️⃣  Health Check..."
RESPONSE=$(curl -sf "$AI_ENGINE/health" 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "   ✅ $RESPONSE"
else
    echo "   ❌ AI Engine not reachable at $AI_ENGINE"
    echo "   💡 Run: ./run.sh local  OR  ./run.sh docker"
    exit 1
fi
echo ""

# 2. Qdrant health
echo "2️⃣  Qdrant Health..."
RESPONSE=$(curl -sf "$QDRANT/healthz" 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "   ✅ Qdrant is healthy"
else
    echo "   ❌ Qdrant not reachable at $QDRANT"
    exit 1
fi
echo ""

# 3. Ingest a sample Moroccan law (Arabic text)
echo "3️⃣  Ingesting sample legal text..."
SAMPLE_TEXT="المادة 1: الدستور هو أسمى قانون في البلاد.
المادة 2: الإسلام دين الدولة.
المادة 3: اللغة العربية هي اللغة الرسمية.
المادة 4: النظام الملكي دستوري.
المادة 5: الملك أمير المؤمنين.
المادة 6: الملك هو ممثل الأمة.
المادة 7: الملك يضمن دوام الدولة.
المادة 8: الملك يحترم الحريات والحقوق.
المادة 9: الملك يحمي البيئة.
المادة 10: الملك يضمن العدالة الاجتماعية."

INGEST_RESPONSE=$(curl -sf -X POST "$AI_ENGINE/v1/documents" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -d "{
    \"text\": \"$SAMPLE_TEXT\",
    \"metadata\": {
      \"source\": \"الدستور المغربي\",
      \"source_fr\": \"Constitution Marocaine\",
      \"law_type\": \"constitutional\",
      \"language\": \"ar\"
    },
    \"doc_id\": \"test_constitution\"
  }" 2>/dev/null)

if [ $? -eq 0 ]; then
    echo "   ✅ Document ingested: $INGEST_RESPONSE"
else
    echo "   ❌ Failed to ingest document"
    echo "   Trying legacy endpoint..."
    INGEST_RESPONSE=$(curl -sf -X POST "$AI_ENGINE/v1/documents?text=$SAMPLE_TEXT&tenant_id=$TENANT_ID&doc_id=test_constitution" 2>/dev/null)
    if [ $? -eq 0 ]; then
        echo "   ✅ Document ingested (legacy): $INGEST_RESPONSE"
    else
        echo "   ❌ Failed on legacy endpoint too"
        exit 1
    fi
fi
echo ""

# 4. Search for relevant articles
echo "4️⃣  Searching: ما هو دين الدولة؟ (What is the state religion?)"
SEARCH_RESPONSE=$(curl -sf -X POST "$AI_ENGINE/v1/search?query=دين+الدstate+الإسلام&tenant_id=$TENANT_ID&n_results=3" 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "   ✅ Search results received"
    echo "   $SEARCH_RESPONSE" | head -c 200
    echo "..."
else
    echo "   ⚠️  Search returned no results (may need more data)"
fi
echo ""

# 5. Ask a legal question (non-streaming)
echo "5️⃣  Asking: ما هي المادة الأولى من الدستور؟"
ASK_RESPONSE=$(curl -sf -X POST "$AI_ENGINE/v1/ask" \
  -H "Content-Type: application/json" \
  -d "{
    \"question\": \"ما هي المادة الأولى من الدستور؟\",
    \"tenant_id\": \"$TENANT_ID\",
    \"n_results\": 5,
    \"stream\": false
  }" 2>/dev/null)

if [ $? -eq 0 ]; then
    echo "   ✅ Answer received:"
    echo "   $ASK_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "   $ASK_RESPONSE"
else
    echo "   ❌ Failed to get answer"
fi
echo ""

echo "============================================"
echo "  ✅ All tests completed!"
echo "============================================"
