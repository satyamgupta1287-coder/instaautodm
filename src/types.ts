export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface InstagramAccount {
  id: string;
  username: string;
  profilePicture: string;
  isConnected: boolean;
}

export interface Rule {
  id: string;
  name: string;
  keyword: string;
  matchType: 'exact' | 'contains';
  template: string;
  isActive: boolean;
  createdAt: Date;
}

export interface Log {
  id: string;
  username: string;
  comment: string;
  status: 'sent' | 'failed' | 'pending';
  timestamp: Date;
  ruleId: string;
}
