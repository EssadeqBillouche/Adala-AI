#!/usr/bin/env bash
# =============================================================================
# Pre-download AI models for the AdalaAI engine
# Models are cached locally so Docker builds are fast and reliable.
# =============================================================================
set -e

CACHE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/.model-cache"
mkdir -p "$CACHE_DIR"

echo "📦 Pre-downloading models to: $CACHE_DIR"
echo ""

# Set cache directories for HuggingFace and FastEmbed
export HF_HOME="$CACHE_DIR/huggingface"
export TRANSFORMERS_CACHE="$CACHE_DIR/huggingface/hub"
export FASTEMBED_CACHE_PATH="$CACHE_DIR/fastembed"

echo "=== Downloading BGE-M3 (dense embeddings, ~2.3 GB) ==="
python3 -c "
import os, sys
os.environ['HF_HOME'] = '$CACHE_DIR/huggingface'
os.environ['TRANSFORMERS_CACHE'] = '$CACHE_DIR/huggingface/hub'
retries = 3
for attempt in range(retries):
    try:
        from sentence_transformers import SentenceTransformer
        print(f'  Attempt {attempt+1}/{retries}...')
        SentenceTransformer('BAAI/bge-m3', trust_remote_code=True)
        print('  ✓ BGE-M3 downloaded successfully')
        break
    except Exception as e:
        print(f'  ✗ Attempt {attempt+1} failed: {e}')
        if attempt == retries - 1:
            print('  ❌ BGE-M3 download failed after 3 attempts')
            sys.exit(1)
"

echo ""
echo "=== Downloading SPLADE PP (sparse embeddings, ~500 MB) ==="
python3 -c "
import os, sys
os.environ['HF_HOME'] = '$CACHE_DIR/huggingface'
os.environ['TRANSFORMERS_CACHE'] = '$CACHE_DIR/huggingface/hub'
os.environ['FASTEMBED_CACHE_PATH'] = '$CACHE_DIR/fastembed'
retries = 3
for attempt in range(retries):
    try:
        from fastembed import SparseTextEmbedding
        print(f'  Attempt {attempt+1}/{retries}...')
        model = SparseTextEmbedding(model_name='prithivida/Splade_PP_en_v1')
        list(model.embed(documents=['test']))
        print('  ✓ SPLADE PP downloaded successfully')
        break
    except Exception as e:
        print(f'  ✗ Attempt {attempt+1} failed: {e}')
        if attempt == retries - 1:
            print('  ❌ SPLADE download failed after 3 attempts')
            sys.exit(1)
"

echo ""
echo "✅ All models downloaded successfully!"
echo "   Cache size: $(du -sh "$CACHE_DIR" | cut -f1)"
echo ""
echo "💡 These models will be baked into the Docker image during build."
