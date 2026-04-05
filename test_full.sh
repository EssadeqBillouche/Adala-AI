#!/usr/bin/env bash
# =============================================================================
# AdalaAI Engine — Full End-to-End Test
# =============================================================================
# Starts the server, ingests a sample Moroccan constitution, runs hybrid
# search, and queries the RAG pipeline.  Tears down on exit.
#
# Usage:  bash test_full.sh
# =============================================================================
set -euo pipefail

cd "$(dirname "$0")/app/ai-engine"

echo "============================================"
echo "  AdalaAI Engine — End-to-End Test"
echo "============================================"
echo ""

# Start server
echo "🚀 Starting AI Engine…"
uvicorn app.main:app --host 0.0.0.0 --port 8000 > /tmp/adala-test.log 2>&1 &
SERVER_PID=$!
echo "   PID: $SERVER_PID"

cleanup() {
    echo ""
    echo "🛑 Stopping server (PID: $SERVER_PID)…"
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
    echo "✅ Done"
}
trap cleanup EXIT

# Wait for readiness (BGE-M3 model download takes ~15 s on first run)
echo "⏳ Waiting for server (BGE-M3 loads on first start)…"
for i in $(seq 1 90); do
    if curl -sf http://localhost:8000/health >/dev/null 2>&1; then
        echo "✅ Server ready after ${i}s"
        break
    fi
    if [ "$i" -eq 90 ]; then
        echo "❌ Server failed to start — logs:"
        cat /tmp/adala-test.log
        exit 1
    fi
    sleep 1
done
echo ""

# ── Test 1: Health ──────────────────────────────────────────────────
echo "1️⃣  Health Check"
HEALTH=$(curl -s http://localhost:8000/health)
echo "   $HEALTH"
echo ""

# ── Test 2: Ingest ──────────────────────────────────────────────────
echo "2️⃣  Ingesting Moroccan Constitution (Arabic)…"
INGEST=$(curl -s -X POST http://localhost:8000/v1/documents \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: test_tenant" \
  -d '{
    "text": "المادة 1: يضمن الدستور لجميع المواطنين والمواطنات على قدم المساواة الحقوق والحريات المدنية والسياسية والاقتصادية والاجتماعية والثقافية والبيئية. وتعمل الدولة على حماية هذه الحقوق وتعزيزها وضمان ممارستها الفعلية.\n\nالمادة 2: الإسلام دين الدولة، والدولة تضمن لكل شخص حرية ممارسة شؤونه الدينية. وتعمل على حماية ثوابت الأمة، وفي طليعتها الإسلام السمح، والهوية الوطنية الراسخة، والمكتسبات الوطنية.\n\nالمادة 3: اللغة العربية هي اللغة الرسمية للدولة. وتعمل الدولة على حمايتها وتطويرها، وتنمية استعمالها في الميادين العلمية والتقنية والثقافية والإعلامية. كما تعتبر الأمازيغية أيضا لغة رسمية للدولة.\n\nالمادة 4: النظام الملكي دستوري، ديمقراطي برلماني واجتماعي. وسيادة للأمة تمارسها مباشرة بالاستفتاء وبصفة غير مباشرة بواسطة ممثليها.\n\nالمادة 5: الملك أمير المؤمنين، وممثل الأمة الأعلى، وضامن دوام الدولة واستمرارها. وهو حامي حمى الملة والدين، والضامن لاحترام الدستور. وله صيانة حقوق وحريات المواطنين والجماعات والهيئات.",
    "metadata": {"source": "الدستور المغربي", "source_fr": "Constitution Marocaine", "law_type": "constitutional", "language": "ar"},
    "doc_id": "moroccan_constitution_test"
  }')
echo "   $INGEST"
echo ""

# ── Test 3: Hybrid Search ───────────────────────────────────────────
echo "3️⃣  Hybrid Search: 'دين الدولة' (state religion)"
SEARCH=$(curl -s -G "http://localhost:8000/v1/search" \
  --data-urlencode "query=دين الدولة الإسلام" \
  -H "X-Tenant-ID: test_tenant" \
  --data-urlencode "n_results=3")
echo "   $SEARCH" | python3 -m json.tool 2>/dev/null | head -25 || echo "   $SEARCH"
echo ""

# ── Test 4: RAG Query (non-streaming) ───────────────────────────────
echo "4️⃣  RAG Query: 'ما هو دين الدولة حسب الدستور؟'"
ASK=$(curl -s -X POST http://localhost:8000/v1/ask \
  -H "Content-Type: application/json" \
  -d '{
    "question": "ما هو دين الدولة حسب الدستور المغربي؟",
    "tenant_id": "test_tenant",
    "n_results": 5,
    "stream": false
  }')
echo "   $ASK" | python3 -m json.tool 2>/dev/null | head -30 || echo "   $ASK"
echo ""

echo "============================================"
echo "  ✅ All tests completed!"
echo "============================================"
