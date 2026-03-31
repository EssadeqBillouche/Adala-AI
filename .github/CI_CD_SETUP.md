# GitHub Actions CI/CD Setup Guide

## 📁 Workflow Files Created

```
.github/
├── workflows/
│   ├── backend-ci.yml      # Backend lint, test, build, security
│   ├── frontend-ci.yml     # Frontend lint, test, build, lighthouse
│   └── deploy.yml          # Docker build, push, and deployment
├── dependabot.yml          # Automatic dependency updates
└── CODEOWNERS             # Code ownership configuration
```

---

## 🔐 Required GitHub Secrets

Navigate to **Settings → Secrets and variables → Actions** and add these secrets:

### Deployment Secrets

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `DEPLOY_USERNAME` | SSH username for server | `deploy` |
| `DEPLOY_SSH_KEY` | Private SSH key for deployment | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `STAGING_HOST` | Staging server hostname/IP | `staging.adala-ai.com` |
| `PRODUCTION_HOST` | Production server hostname/IP | `adala-ai.com` |

### Application Secrets

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL for frontend | `https://api.adala-ai.com` |

---

## 🔑 SSH Key Setup

Generate a dedicated SSH key for GitHub Actions:

```bash
# Generate new SSH key
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy

# Copy public key to server
ssh-copy-id -i ~/.ssh/github_actions_deploy.pub deploy@your-server.com

# Add private key to GitHub Secrets
cat ~/.ssh/github_actions_deploy | pbcopy  # macOS
# or
cat ~/.ssh/github_actions_deploy | xclip -selection clipboard  # Linux
```

---

## 🌍 GitHub Environments Setup

### 1. Create Environments

Go to **Settings → Environments** and create:

#### Staging Environment
- **Name:** `staging`
- **Deployment branches:** Selected branches → `main`
- **Environment variables:** (optional)
  - `API_URL`: Staging API URL

#### Production Environment
- **Name:** `production`
- **Deployment branches:** Selected branches → `main`
- **Required reviewers:** Add team members for approval
- **Wait timer:** 5 minutes (optional safety delay)
- **Environment variables:** (optional)
  - `API_URL`: Production API URL

---

## 🚀 How It Works

### Backend CI (`backend-ci.yml`)

**Triggers:**
- Push to `main` or `develop` (backend files only)
- Pull requests targeting `main` or `develop`

**Jobs:**
1. ✅ **Lint** - ESLint + Prettier
2. 🧪 **Test** - Jest unit tests (Node 18 & 20)
3. 🔨 **Build** - TypeScript compilation
4. 🔒 **Security** - npm audit
5. 🎭 **E2E** - End-to-end tests with PostgreSQL

**Caching:**
- `node_modules` via `actions/setup-node` cache
- Dependencies cached based on `package-lock.json`

---

### Frontend CI (`frontend-ci.yml`)

**Triggers:**
- Push to `main` or `develop` (frontend files only)
- Pull requests targeting `main` or `develop`

**Jobs:**
1. ✅ **Lint** - ESLint + TypeScript check
2. 🧪 **Test** - Jest tests (Node 18 & 20)
3. 🔨 **Build** - Next.js production build
4. 📊 **Lighthouse** - Performance & accessibility
5. 📦 **Bundle Analysis** - Size report

**Caching:**
- `node_modules` via `actions/setup-node` cache
- Next.js build cache
- Dependencies cached based on `package-lock.json`

---

### Deploy Workflow (`deploy.yml`)

**Triggers:**
- Push to `main` branch
- Version tags (`v*.*.*`)
- Manual workflow dispatch

**Jobs:**
1. 🏷️ **Metadata** - Generate version tags
2. 🐳 **Build Backend** - Multi-arch Docker image → GHCR
3. 🎨 **Build Frontend** - Multi-arch Docker image → GHCR
4. 🔒 **Security Scan** - Trivy vulnerability scan
5. 🚀 **Deploy Staging** - Auto-deploy to staging
6. ✅ **Deploy Production** - Manual approval required

**Docker Tags:**
- `latest` - Latest main branch build
- `sha-{short}` - Specific commit
- `v1.2.3` - Release tag

---

## 📊 Branch Protection Rules

Configure in **Settings → Branches → Branch protection rules**:

### For `main` branch:
```
✓ Require a pull request before merging
✓ Require approvals (1)
✓ Require status checks to pass before merging
  ✓ backend-ci-status
  ✓ frontend-ci-status
✓ Require branches to be up to date before merging
✓ Include administrators
```

---

## 🔧 Manual Deployment

Deploy manually via GitHub Actions:

1. Go to **Actions → Deploy**
2. Click **Run workflow**
3. Select environment: `staging` or `production`
4. Click **Run workflow**

---

## 📈 Monitoring & Artifacts

### Test Results
- Coverage reports uploaded as artifacts (7-day retention)
- Available in workflow run summary

### Docker Images
- View at: `https://github.com/{org}/{repo}/pkgs/container/backend`
- View at: `https://github.com/{org}/{repo}/pkgs/container/frontend`

### Security Scans
- Trivy results in **Security → Code scanning alerts**
- npm audit results in workflow logs

---

## 🐛 Troubleshooting

### Workflow not triggering?
- Check file paths in `on.paths` filters
- Verify branch names match configuration
- Ensure workflows are not disabled

### Cache not working?
- Cache key includes `package-lock.json` hash
- Clear cache: **Actions → Select workflow → ... → Clear cache**

### Deployment failed?
- Verify SSH key has correct permissions
- Check server firewall allows GitHub Actions IPs
- Review environment protection rules

### Docker build slow?
- GitHub Actions cache should speed up subsequent builds
- Check `cache-from` and `cache-to` configuration

---

## 🎯 Best Practices Implemented

✅ **Incremental builds** - Only runs when relevant files change  
✅ **Parallel execution** - Backend and frontend CI run independently  
✅ **Matrix testing** - Tests on multiple Node.js versions  
✅ **Artifact retention** - Test results stored for 7 days  
✅ **Security scanning** - Trivy + npm audit on every deploy  
✅ **Multi-arch builds** - AMD64 and ARM64 support  
✅ **Environment protection** - Production requires approval  
✅ **Automatic updates** - Dependabot for dependencies  
✅ **Concurrency control** - Cancels redundant workflow runs  
✅ **Comprehensive caching** - node_modules, Docker layers, build artifacts  

---

## 📝 Next Steps

1. ✅ Add all required GitHub Secrets
2. ✅ Create Staging and Production environments
3. ✅ Configure branch protection rules
4. ✅ Test workflow with a small PR
5. ✅ Set up monitoring notifications (optional)

---

## 🔗 Useful Links

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Buildx Reference](https://github.com/docker/buildx)
- [Lighthouse CI](https://github.com/treosh/lighthouse-ci-action)
- [Trivy Scanner](https://github.com/aquasecurity/trivy-action)
