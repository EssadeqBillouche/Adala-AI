import { UserRole } from '../../users/entities/user.entity';

/**
 * The payload encoded inside the JWT token.
 * Created during login, decoded by JwtStrategy.
 */
export interface JwtPayload {
  /** User email */
  email: string;
  /** User ID (standard JWT "sub" claim) */
  sub: string;
  /** User role */
  role: UserRole;
  /** Organization ID for multi-tenancy */
  orgId: string;
}

/**
 * The authenticated user object attached to `req.user` by JwtStrategy.validate().
 * This is what `@CurrentUser()` returns in controllers.
 */
export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: UserRole;
  orgId: string;
}

/**
 * The user object returned by LocalStrategy.validate() / AuthService.validateUser().
 * This is the User entity minus the passwordHash.
 */
export interface ValidatedUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
  lastLoginAt: Date;
  organizationId: string;
  organization: { id: string; name: string };
  createdAt: Date;
  updatedAt: Date;
}
