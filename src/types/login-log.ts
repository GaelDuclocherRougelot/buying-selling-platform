export type LoginAction =
	| "login"
	| "logout"
	| "failed_login"
	| "password_reset"
	| "account_locked";

export interface LoginLog {
	id: string;
	userId: string;
	action: LoginAction;
	ipAddress?: string;
	userAgent?: string;
	location?: string;
	success: boolean;
	failureReason?: string;
	createdAt: Date;
}

export interface CreateLoginLogData {
	userId: string;
	action: LoginAction;
	ipAddress?: string;
	userAgent?: string;
	location?: string;
	success?: boolean;
	failureReason?: string;
}

export interface LoginLogFilters {
	userId?: string;
	action?: LoginAction;
	success?: boolean;
	startDate?: Date;
	endDate?: Date;
	limit?: number;
	offset?: number;
}
