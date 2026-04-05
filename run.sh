#!/usr/bin/env bash
# =============================================================================
# AdalaAI - Quick Start Script
# Switches between Local Dev mode and Docker Compose mode
# =============================================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/app/ai-engine/.env"
ENV_DOCKER="$SCRIPT_DIR/app/ai-engine/.env.docker"
COMPOSE_FILE="$SCRIPT_DIR/app/docker-compose.yml"

usage() {
    echo ""
    echo "  Usage: $0 <mode>"
    echo ""
    echo "  Modes:"
    echo "    local     - Run AI engine locally with uvicorn (Qdrant in Docker)"
    echo "    docker    - Run full stack via Docker Compose"
    echo "    status    - Check what's running"
    echo "    stop      - Stop all running services"
    echo "    test      - Quick health check on all services"
    echo ""
}

mode_local() {
    echo "🔧 Starting LOCAL DEV MODE..."
    echo ""

    # Ensure .env points to localhost
    if grep -q "QDRANT_URL=http://localhost:6333" "$ENV_FILE" 2>/dev/null; then
        echo "✅ .env already configured for localhost"
    else
        echo "⚙️  Updating .env for localhost Qdrant..."
        sed -i 's|QDRANT_URL=http://qdrant:6333|QDRANT_URL=http://localhost:6333|g' "$ENV_FILE"
    fi

    # Start Qdrant only
    echo "🐳 Starting Qdrant container..."
    cd "$SCRIPT_DIR/app"
    docker compose up -d qdrant

    # Wait for Qdrant
    echo "⏳ Waiting for Qdrant to be healthy..."
    for i in $(seq 1 30); do
        if curl -sf http://localhost:6333/health > /dev/null 2>&1; then
            echo "✅ Qdrant is ready!"
            break
        fi
        if [ "$i" -eq 30 ]; then
            echo "❌ Qdrant failed to start in 30s"
            exit 1
        fi
        sleep 1
    done

    echo ""
    echo "🚀 Starting AI Engine with uvicorn..."
    echo "   → API docs: http://localhost:8000/docs"
    echo "   → Health:   http://localhost:8000/health"
    echo ""

    cd "$SCRIPT_DIR/app/ai-engine"
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
}

mode_docker() {
    echo "🐳 Starting DOCKER COMPOSE MODE..."
    echo ""

    # Ensure .env uses docker service name
    if grep -q "QDRANT_URL=http://qdrant:6333" "$ENV_FILE" 2>/dev/null; then
        echo "✅ .env already configured for Docker"
    else
        echo "⚙️  Updating .env for Docker Compose..."
        sed -i 's|QDRANT_URL=http://localhost:6333|QDRANT_URL=http://qdrant:6333|g' "$ENV_FILE"
    fi

    echo "🏗️  Building and starting all services..."
    cd "$SCRIPT_DIR/app"
    docker compose up -d --build

    echo ""
    echo "⏳ Waiting for services to be ready..."
    sleep 5

    echo ""
    echo "✅ All services started!"
    echo ""
    echo "  📊 Qdrant Dashboard: http://localhost:6333/dashboard"
    echo "  🌐 Full App (Nginx):  http://localhost:80"
    echo ""
    echo "  View logs: docker compose logs -f ai-engine"
    echo "  Stop:      $0 stop"
}

mode_status() {
    echo "📊 Running Services:"
    echo ""
    cd "$SCRIPT_DIR/app"
    docker compose ps 2>/dev/null || echo "  (no docker compose services running)"
    echo ""

    # Check local services
    if curl -sf http://localhost:8000/health > /dev/null 2>&1; then
        echo "  ✅ AI Engine (local): http://localhost:8000"
    else
        echo "  ❌ AI Engine (local): not running"
    fi

    if curl -sf http://localhost:6333/health > /dev/null 2>&1; then
        echo "  ✅ Qdrant:            http://localhost:6333"
    else
        echo "  ❌ Qdrant:            not running"
    fi
}

mode_stop() {
    echo "🛑 Stopping all services..."
    cd "$SCRIPT_DIR/app"
    docker compose down
    echo "✅ All services stopped"
}

mode_test() {
    echo "🧪 Running Health Checks..."
    echo ""

    PASS=0
    FAIL=0

    # Check Qdrant
    if curl -sf http://localhost:6333/health > /dev/null 2>&1; then
        echo "  ✅ Qdrant (localhost:6333)"
        PASS=$((PASS + 1))
    else
        echo "  ❌ Qdrant (localhost:6333) - not reachable"
        FAIL=$((FAIL + 1))
    fi

    # Check AI Engine
    if curl -sf http://localhost:8000/health > /dev/null 2>&1; then
        echo "  ✅ AI Engine (localhost:8000)"
        PASS=$((PASS + 1))
    else
        echo "  ❌ AI Engine (localhost:8000) - not reachable"
        FAIL=$((FAIL + 1))
    fi

    # Check Full App via Nginx
    if curl -sf http://localhost:80 > /dev/null 2>&1; then
        echo "  ✅ Frontend (localhost:80)"
        PASS=$((PASS + 1))
    else
        echo "  ❌ Frontend (localhost:80) - not reachable"
        FAIL=$((FAIL + 1))
    fi

    echo ""
    echo "  Results: $PASS passed, $FAIL failed"
    echo ""

    if [ "$FAIL" -gt 0 ]; then
        echo "💡 Tip: Run '$0 docker' to start the full stack"
        echo "   or: '$0 local' to run AI engine locally"
    fi
}

# Main
case "${1:-}" in
    local)
        mode_local
        ;;
    docker)
        mode_docker
        ;;
    status)
        mode_status
        ;;
    stop)
        mode_stop
        ;;
    test)
        mode_test
        ;;
    *)
        usage
        ;;
esac
