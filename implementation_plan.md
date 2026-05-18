# Adala-AI Backend Refactoring Guide (For AI Agent)

> [!IMPORTANT]
> You are an AI agent executing this refactoring plan autonomously.
> **After completing EVERY step below, you MUST run:**
> ```bash
> git add -A && git commit -m "<step number>: <short description>"
> ```
> Never batch multiple steps into one commit. Each step is atomic.

---

## Context

This is a NestJS + TypeORM + PostgreSQL backend located at:
```
app/backend/src/
```
The project uses RLS-based multi-tenancy via `TenancyService`. Issues are ordered from most critical to least critical. Fix them exactly as described.

---

## PHASE 1 — Critical Security Fixes (P0)

### Step 1 — Fix SQL Injection in TenancyService

**File:** `src/tenancy/tenancy.service.ts`

Before the `SET LOCAL` query, add UUID validation:

```typescript
if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tenantId)) {
  throw new UnauthorizedException('Invalid tenant identifier');
}
```

Import `UnauthorizedException` from `@nestjs/common`.

**Commit:** `git add -A && git commit -m "step-1: fix SQL injection via UUID validation in TenancyService"`

---

### Step 2 — Disable `synchronize: true` in Production

**Files:**
- `src/config/typeorm.config.ts`
- `src/config/data-source.config.ts`

Change every occurrence of `synchronize: true` to:
```typescript
synchronize: process.env.NODE_ENV !== 'production',
```

**Commit:** `git add -A && git commit -m "step-2: disable TypeORM synchronize in production"`

---

### Step 3 — Gate Swagger Behind Non-Production Guard

**File:** `src/main.ts`

Wrap the entire Swagger setup block in:
```typescript
if (configService.get<string>('NODE_ENV') !== 'production') {
  // existing swagger setup
}
```

**Commit:** `git add -A && git commit -m "step-3: hide Swagger docs in production"`

---

### Step 4 — Remove Private Field Access via Bracket Notation

**File:** `src/auth/auth.controller.ts`

In the `register()` method, replace:
```typescript
const access_token = this.authService['jwtService'].sign(payload);
```
with a call to a new public method on `AuthService`.

**File:** `src/auth/auth.service.ts`

Add a public method:
```typescript
signToken(payload: object): string {
  return this.jwtService.sign(payload);
}
```

Then update `auth.controller.ts` to call `this.authService.signToken(payload)`.

**Commit:** `git add -A && git commit -m "step-4: remove bracket notation private access in AuthController"`

---

### Step 5 — Align JWT and Cookie Expiry

**Files:** `src/auth/auth.controller.ts` and `src/auth/auth.module.ts`

Set both to **1 hour**:
- Cookie: `maxAge: 3600 * 1000`
- JWT: `expiresIn: '1h'`

**Commit:** `git add -A && git commit -m "step-5: align JWT and cookie expiry to 1 hour"`

---

### Step 6 — Fix Unhandled Bootstrap Rejection

**File:** `src/main.ts`

Change:
```typescript
bootstrap();
```
to:
```typescript
bootstrap().catch((err) => {
  console.error('Fatal: Failed to start application', err);
  process.exit(1);
});
```

**Commit:** `git add -A && git commit -m "step-6: handle bootstrap promise rejection"`

---

## PHASE 2 — Authorization & Access Control (P1)

### Step 7 — Add Role Guards to Sensitive Endpoints

Add `@UseGuards(RolesGuard)` and `@Roles(UserRole.OWNER, UserRole.ADMIN)` to:

- **All write endpoints** in `src/organizations/credit-ledger.controller.ts`
- **All write endpoints** in `src/organizations/subscription.controller.ts`
- **All endpoints** in `src/organizations/api-key.controller.ts`
- **GET /audit-logs** in `src/organizations/audit-log.controller.ts`

Import `RolesGuard`, `Roles`, and `UserRole` from their existing locations.

**Commit:** `git add -A && git commit -m "step-7: add RolesGuard to sensitive organization endpoints"`

---

### Step 8 — Add `ParseUUIDPipe` to All Path Parameters

In every controller that has `@Param('id') id: string`, change it to:
```typescript
@Param('id', ParseUUIDPipe) id: string
```

Import `ParseUUIDPipe` from `@nestjs/common`. Apply to ALL controllers.

**Commit:** `git add -A && git commit -m "step-8: add ParseUUIDPipe to all path param decorators"`

---

### Step 9 — Fix Invitation Accept Flow

**File:** `src/users/invitations.service.ts`

In the `accept()` method:
1. After setting invitation status to `ACCEPTED`, also update the user: `user.organizationId = invitation.organizationId`
2. Save the user entity.
3. Replace `runWithTenant()` with `runBypassingTenant()` so cross-tenant invitation lookup works.

**Commit:** `git add -A && git commit -m "step-9: fix invitation accept to update user org and use bypass tenant"`

---

### Step 10 — Fix Owner Role on Registration

**File:** `src/auth/auth.service.ts`

When creating a new user during registration, explicitly set:
```typescript
role: UserRole.OWNER,
```

**Commit:** `git add -A && git commit -m "step-10: assign OWNER role to registering user"`

---

## PHASE 3 — Data Integrity & Business Logic (P2)

### Step 11 — Wrap Registration in a Transaction

**File:** `src/auth/auth.service.ts`

Wrap Organization creation and User creation in a single `dataSource.transaction(async (manager) => { ... })` block so both succeed or both roll back.

**Commit:** `git add -A && git commit -m "step-11: make registration atomic with a DB transaction"`

---

### Step 12 — Remove Client-Supplied Balance Fields from Credit Ledger DTO

**File:** `src/organizations/dto/create-credit-ledger.dto.ts`

Remove `balanceBefore` and `balanceAfter` from the DTO.

**File:** `src/organizations/credit-ledger.service.ts`

Compute them server-side:
```typescript
const current = await this.getCurrentBalance(organizationId);
entry.balanceBefore = current;
entry.balanceAfter = current + dto.amount;
```

**Commit:** `git add -A && git commit -m "step-12: compute credit balance server-side, remove client input"`

---

### Step 13 — Replace `Object.assign()` with Explicit Field Mapping

In each of these services, replace `Object.assign(entity, dto)` with explicit field assignment (only the fields that are safe to update):

- `src/projects/conversations.service.ts`
- `src/projects/messages.service.ts`
- `src/organizations/subscription.service.ts`
- `src/organizations/api-key.service.ts`

**Commit:** `git add -A && git commit -m "step-13: replace Object.assign with explicit field mapping in update methods"`

---

### Step 14 — Fix `daysRemaining()` Bug in Subscription Entity

**File:** `src/organizations/entities/subscription.entity.ts`

The method has a dead ternary — both branches return `this.currentPeriodEnd`. Fix the logic:
```typescript
daysRemaining(): number {
  if (this.cancelAtPeriodEnd) return 0;
  const msLeft = new Date(this.currentPeriodEnd).getTime() - Date.now();
  return Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
}
```

**Commit:** `git add -A && git commit -m "step-14: fix daysRemaining dead ternary in Subscription entity"`

---

### Step 15 — Fix Subscription Relation Type

**File:** `src/organizations/entities/subscription.entity.ts`

Change `@OneToMany(() => Organization, ...)` to `@ManyToOne(() => Organization, ...)` with `@JoinColumn()`. A subscription belongs to one organization, not many.

**Commit:** `git add -A && git commit -m "step-15: fix Subscription entity relation from OneToMany to ManyToOne"`

---

### Step 16 — Fix `User.canAccess()` Unused Parameter

**File:** `src/users/entities/user.entity.ts`

Either implement real resource-based logic, or remove the unused `resource` parameter entirely and rename the method to `isPrivileged()`:
```typescript
isPrivileged(): boolean {
  return this.role === UserRole.OWNER || this.role === UserRole.ADMIN || this.isActive;
}
```

Update all call sites.

**Commit:** `git add -A && git commit -m "step-16: fix canAccess unused parameter, rename to isPrivileged"`

---

### Step 17 — Move `getCreditsRemaining()` Out of Entity

**File:** `src/projects/entities/conversation.entity.ts`

Remove the `getCreditsRemaining()` method from the entity.

**File:** `src/projects/conversations.service.ts`

Add a `getCreditsRemaining(conversationId: string)` method that loads the conversation with `relations: ['organization']` and computes the value from the service layer.

**Commit:** `git add -A && git commit -m "step-17: move getCreditsRemaining logic to ConversationsService"`

---

### Step 18 — Add Pagination to All `findAll()` Methods

Add `limit` (default `20`, max `100`) and `offset` (default `0`) query params to every controller's list endpoint. Apply `.take(limit).skip(offset)` in the corresponding service queries. Affected services:
- `projects`, `conversations`, `messages`, `legal-sources`, `credit-ledger`, `api-keys`, `invitations`

**Commit:** `git add -A && git commit -m "step-18: add offset pagination to all findAll list endpoints"`

---

## PHASE 4 — Module Restructure (P2.5)

> [!IMPORTANT]
> Do each sub-step as its own commit. Update all import paths after every move.
> Run `npm run build` after each sub-step to catch broken imports before committing.

### Step 19 — Create `src/common/enums/` and Move Shared Enums

Move shared enums (`Locale`, `LegalDomain`, `Jurisdiction`) from `projects/entities/enums/` to `src/common/enums/`. Update all import paths across the codebase.

**Commit:** `git add -A && git commit -m "step-19: move shared enums to src/common/enums"`

---

### Step 20 — Fix Directory Case: `Interceptors` → `interceptors`

Rename `src/common/Interceptors/` to `src/common/interceptors/` (lowercase). Update all imports. This fixes Linux/Docker case-sensitivity breakage.

**Commit:** `git add -A && git commit -m "step-20: rename Interceptors to interceptors (fix case sensitivity)"`

---

### Step 21 — Extract `invitations/` Module from `users/`

Create `src/invitations/` with:
- `invitations.module.ts`
- `invitations.controller.ts`
- `public-invitations.controller.ts`
- `invitations.service.ts`
- `entities/invitation.entity.ts`
- `dto/` (move relevant DTOs)

Remove invitation files from `src/users/`. Register the new module in `app.module.ts`. Update all imports.

**Commit:** `git add -A && git commit -m "step-21: extract invitations into standalone module"`

---

### Step 22 — Extract `billing/` Module from `organizations/`

Create `src/billing/` with sub-directories:
```
billing/
├── billing.module.ts
├── credit-ledger/
│   ├── credit-ledger.controller.ts
│   ├── credit-ledger.service.ts
│   ├── entities/credit-ledger.entity.ts
│   └── dto/
└── subscriptions/
    ├── subscription.controller.ts
    ├── subscription.service.ts
    ├── entities/subscription.entity.ts
    └── dto/
```

Remove billing files from `src/organizations/`. Register in `app.module.ts`. Update all imports.

**Commit:** `git add -A && git commit -m "step-22: extract billing (credits + subscriptions) into standalone module"`

---

### Step 23 — Extract `api-keys/` Module from `organizations/`

Create `src/api-keys/` with controller, service, entity, and DTOs. Remove from `src/organizations/`. Register in `app.module.ts`. Update all imports.

**Commit:** `git add -A && git commit -m "step-23: extract api-keys into standalone module"`

---

### Step 24 — Extract `audit/` Module from `organizations/`

Create `src/audit/` with controller, service, entity, and DTOs. Remove from `src/organizations/`. Register in `app.module.ts`. Update all imports.

**Commit:** `git add -A && git commit -m "step-24: extract audit-log into standalone module"`

---

### Step 25 — Extract `conversations/` Module from `projects/`

Create `src/conversations/` with:
```
conversations/
├── conversations.module.ts
├── conversations.controller.ts
├── conversations.service.ts
├── messages.controller.ts
├── messages.service.ts
├── entities/
│   ├── conversation.entity.ts
│   ├── message.entity.ts
│   └── message-citation.entity.ts
└── dto/
```

Remove from `src/projects/`. Register in `app.module.ts`. Update all imports.

**Commit:** `git add -A && git commit -m "step-25: extract conversations and messages into standalone module"`

---

### Step 26 — Extract `legal-sources/` Module from `projects/`

Create `src/legal-sources/` with controller, service, entity, and DTOs. Remove from `src/projects/`. Register in `app.module.ts`. Update all imports.

**Commit:** `git add -A && git commit -m "step-26: extract legal-sources into standalone module"`

---

## PHASE 5 — Multi-Tenancy Gaps (P3)

### Step 27 — Add RLS Policies to Missing Tables

Create a new migration that adds RLS + policy to:
- `credit_ledgers`
- `subscriptions`
- `api_keys`
- `audit_logs`
- `invitations`

Each table should get:
```sql
ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON <table>
  USING (organization_id::text = current_setting('app.current_tenant_id', true));
```

**Commit:** `git add -A && git commit -m "step-27: add RLS policies to all tenant-scoped tables"`

---

### Step 28 — Fix `runBypassingTenant()` Empty-String Bug

**File:** `src/tenancy/tenancy.service.ts`

The current implementation sets tenant to `''` which matches nothing. Fix by using `SET LOCAL ROLE` to a superuser DB role, or use `RESET ALL` to drop the session variable:
```typescript
await manager.query(`SET LOCAL "app.current_tenant_id" = '00000000-0000-0000-0000-000000000000'`);
// and add a bypass policy: USING (true) FOR ALL TO <app_role>
```
OR document the architectural decision in a comment and add a `BY_PASS_RLS` PostgreSQL role. Either approach must be consistent. Pick one and apply it.

**Commit:** `git add -A && git commit -m "step-28: fix runBypassingTenant empty-string RLS bypass bug"`

---

## PHASE 6 — Reliability & Observability (P4)

### Step 29 — Add Health Check Endpoint

Install: `npm install @nestjs/terminus`

Create `src/health/health.module.ts` and `src/health/health.controller.ts` with a `/health` endpoint that checks DB connectivity using `TypeOrmHealthIndicator`. Register in `app.module.ts`.

**Commit:** `git add -A && git commit -m "step-29: add /health endpoint with DB check via @nestjs/terminus"`

---

### Step 30 — Add Timeout to AI Engine Calls

**File:** `src/ai-engine/ai-engine.service.ts`

Wrap the `fetch()` call with an `AbortController`:
```typescript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 30_000);
try {
  const response = await fetch(url, { ...options, signal: controller.signal });
  // ...
} finally {
  clearTimeout(timeout);
}
```

**Commit:** `git add -A && git commit -m "step-30: add 30s AbortController timeout to AI engine fetch calls"`

---

### Step 31 — Fix `COOKIE_OPTIONS` Reading `process.env` at Import Time

**File:** `src/auth/auth.controller.ts`

Move `COOKIE_OPTIONS` from a module-level constant to a getter method or inline it inside each handler using the injected `ConfigService`:
```typescript
private getCookieOptions() {
  return {
    secure: this.configService.get<string>('NODE_ENV') === 'production',
    httpOnly: true,
    maxAge: 3600 * 1000,
  };
}
```

**Commit:** `git add -A && git commit -m "step-31: fix COOKIE_OPTIONS to read from ConfigService at runtime"`

---

### Step 32 — Create `AskStreamDto` for AI Controller

**File:** `src/ai/ai.controller.ts`

Create `src/ai/dto/ask-stream.dto.ts`:
```typescript
export class AskStreamDto {
  @IsString() @IsNotEmpty() @MaxLength(5000) question: string;
  @IsOptional() @IsUUID() conversationId?: string;
}
```

Replace the inline `body: { question: string; conversationId?: string }` with `@Body() body: AskStreamDto`.

**Commit:** `git add -A && git commit -m "step-32: add AskStreamDto with validation for AI controller"`

---

### Step 33 — Fix `AllExceptionsFilter` DI Registration

**File:** `src/main.ts`

Remove: `app.useGlobalFilters(new AllExceptionsFilter());`

**File:** `src/app.module.ts`

Add to providers:
```typescript
{ provide: APP_FILTER, useClass: AllExceptionsFilter }
```

Import `APP_FILTER` from `@nestjs/core`.

**Commit:** `git add -A && git commit -m "step-33: register AllExceptionsFilter via DI instead of new keyword"`

---

### Step 34 — Skip TransformInterceptor for SSE Endpoints

**File:** `src/common/interceptors/transform.interceptor.ts`

Check if the response is already being streamed (using `ExecutionContext`) and skip wrapping:
```typescript
const response = context.switchToHttp().getResponse();
if (response.writableEnded || context.getHandler().name === 'askStream') {
  return next.handle();
}
```

Or add a custom `@SkipTransform()` decorator and check for it in the interceptor.

**Commit:** `git add -A && git commit -m "step-34: skip TransformInterceptor for SSE streaming endpoints"`

---

## PHASE 7 — Code Quality Cleanup (P5)

### Step 35 — Replace `any` with `AuthenticatedUser` Type

In every controller, replace:
```typescript
@CurrentUser() user: any
```
with:
```typescript
@CurrentUser() user: AuthenticatedUser
```

Import `AuthenticatedUser` from its existing interfaces file.

**Commit:** `git add -A && git commit -m "step-35: replace any with AuthenticatedUser type in all controllers"`

---

### Step 36 — Remove Unused `DataSource` Injections

Remove `DataSource` from the constructor injections in every service that does not call it directly:
- `CreditLedgerService`
- `SubscriptionService`
- `ConversationsService`
- `MessagesService`
- `LegalSourcesService`
- `AuditLogService`
- `ApiKeyService`

**Commit:** `git add -A && git commit -m "step-36: remove unused DataSource injections from services"`

---

### Step 37 — Fix Cascade Direction on User → Organization Relation

**File:** `src/users/entities/user.entity.ts`

Remove `cascade: true` from the `@ManyToOne` to Organization. Cascades should only go parent → child, not child → parent.

**Commit:** `git add -A && git commit -m "step-37: remove incorrect cascade:true from User ManyToOne Organization"`

---

### Step 38 — Register `ClassSerializerInterceptor` Globally

**File:** `src/app.module.ts`

Add to providers:
```typescript
{ provide: APP_INTERCEPTOR, useClass: ClassSerializerInterceptor }
```

This ensures `@Exclude()` on `passwordHash` in the User entity actually works.

**Commit:** `git add -A && git commit -m "step-38: register ClassSerializerInterceptor globally for @Exclude() support"`

---

### Step 39 — Configure Per-Route Throttling

**File:** `src/auth/auth.controller.ts`

Add aggressive throttling to login/register:
```typescript
@Throttle({ default: { limit: 5, ttl: 60000 } })
```

Loosen throttling on read-only list endpoints using `@SkipThrottle()` or a higher limit.

**Commit:** `git add -A && git commit -m "step-39: configure per-route throttling (strict on auth, relaxed on reads)"`

---

## Final Verification

After all 39 steps and commits, run the full verification suite:

```bash
# Type check
npm run build

# Lint
npm run lint

# Unit tests
npm test

# E2E tests
npm run test:e2e
```

Fix any remaining TypeScript errors or lint warnings and commit:
```bash
git add -A && git commit -m "final: post-refactor build and lint fixes"
```

Then open a Pull Request summarizing all 39 steps completed.

---

## Summary Table

| Step | Area | Description |
|------|------|-------------|
| 1 | Security | UUID validation before SQL interpolation |
| 2 | Security | Disable `synchronize` in production |
| 3 | Security | Gate Swagger behind env check |
| 4 | Security | Remove private bracket notation access |
| 5 | Security | Align JWT and cookie expiry |
| 6 | Reliability | Handle bootstrap promise rejection |
| 7 | Auth | Add RolesGuard to sensitive endpoints |
| 8 | Auth | ParseUUIDPipe on all path params |
| 9 | Auth | Fix invitation accept flow |
| 10 | Auth | Fix OWNER role on registration |
| 11 | Data | Atomic registration transaction |
| 12 | Data | Server-computed credit balances |
| 13 | Data | Replace Object.assign with explicit mapping |
| 14 | Data | Fix daysRemaining dead ternary |
| 15 | Data | Fix Subscription relation type |
| 16 | Data | Fix canAccess unused parameter |
| 17 | Data | Move getCreditsRemaining to service |
| 18 | Data | Add pagination to all list endpoints |
| 19 | Structure | Move shared enums to common/ |
| 20 | Structure | Fix Interceptors directory casing |
| 21 | Structure | Extract invitations module |
| 22 | Structure | Extract billing module |
| 23 | Structure | Extract api-keys module |
| 24 | Structure | Extract audit module |
| 25 | Structure | Extract conversations module |
| 26 | Structure | Extract legal-sources module |
| 27 | Tenancy | Add RLS to missing tables |
| 28 | Tenancy | Fix runBypassingTenant empty-string bug |
| 29 | Ops | Add /health endpoint |
| 30 | Ops | Add timeout to AI engine calls |
| 31 | Ops | Fix COOKIE_OPTIONS env read timing |
| 32 | Ops | Add AskStreamDto validation |
| 33 | Ops | Fix AllExceptionsFilter DI registration |
| 34 | Ops | Skip TransformInterceptor for SSE |
| 35 | Quality | Replace any with AuthenticatedUser |
| 36 | Quality | Remove unused DataSource injections |
| 37 | Quality | Fix cascade direction on User entity |
| 38 | Quality | Register ClassSerializerInterceptor globally |
| 39 | Quality | Per-route throttle configuration |
