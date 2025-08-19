export interface GitlabInstance {
  id?: string;
  url: string;
  name: string;
  token?: string;
}

export interface Website {
  id?: string;
  url: string;
  name: string;
}

export interface DnsDomain {
  id?: string;
  domain: string;
  recordTypes: string[];
}

export interface ServerInstance {
  id?: string;
  name: string;
  ip: string;
  netdataUrl: string;
}

export interface Settings {
  gitlab: {
    instances: GitlabInstance[];
  };
  uptime: {
    websites: Website[];
  };
  dns: {
    domains: DnsDomain[];
  };
  servers: {
    instances: ServerInstance[];
  };
}

export type StatusType = 'healthy' | 'warning' | 'error' | 'inactive';

export interface GitlabProject {
  id: number;
  name: string;
  description: string;
  status: StatusType;
  openIssues: number;
  branches: number;
  pullRequests: number;
  lastCommit: string;
  instanceUrl: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  loading: boolean;
}

// Environment credentials types
export interface EnvAccount {
  name: string;
  email: string;
  password: string;
  role?: string;
  displayName?: string;
}

export interface EnvCredentialsConfig {
  enabled: boolean;
  autoSignIn: boolean;
  accounts: EnvAccount[];
  defaultAccount?: string;
  allowFallback: boolean;
  strictMode: boolean;
}

// Authentication method types
export type AuthenticationMethod = 'manual' | 'environment';

export interface AuthenticationSource {
  method: AuthenticationMethod;
  accountName?: string; // For environment auth, the account name used
  timestamp: Date;
}
