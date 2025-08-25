// Authentication domain services
export { roleService, UserRole, Permission } from './roleService';
export type { UserRoleInfo } from './roleService';

export { 
  envCredentialsService, 
  EnvCredentialsError, 
  EnvCredentialsErrorType 
} from './envCredentialsService';
export type { ValidationResult } from './envCredentialsService';

export { 
  authLogger, 
  AuthEventType, 
  AuthEventLevel 
} from './authLogger';
export type { AuthLogEntry, AuditSummary } from './authLogger';
