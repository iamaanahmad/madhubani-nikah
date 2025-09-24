import { ID, Models } from 'appwrite';
import { account, AppwriteService } from '../appwrite';
import { AppwriteUtils } from '../appwrite-utils';

// Types for authentication
export interface AuthResult {
  user: Models.User<Models.Preferences>;
  session: Models.Session;
}

export interface OTPResult {
  userId: string;
  secret: string;
  expire: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface PhoneAuthData {
  phone: string;
  countryCode?: string;
}

export interface SessionInfo {
  user: Models.User<Models.Preferences> | null;
  session: Models.Session | null;
  isAuthenticated: boolean;
}

export class AuthService {
  /**
   * Register user with email and password
   */
  static async registerWithEmail(data: RegisterData): Promise<AuthResult> {
    return AppwriteService.executeWithErrorHandling(async () => {
      // Validate input
      if (!AppwriteUtils.isValidEmail(data.email)) {
        throw new Error('Invalid email format');
      }

      if (data.password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }

      if (data.name.trim().length < 2) {
        throw new Error('Name must be at least 2 characters long');
      }

      // Sanitize input
      const sanitizedData = {
        email: data.email.toLowerCase().trim(),
        password: data.password,
        name: AppwriteUtils.sanitizeInput(data.name)
      };

      // Create user account
      const user = await account.create(
        ID.unique(),
        sanitizedData.email,
        sanitizedData.password,
        sanitizedData.name
      );

      // Create session
      const session = await account.createEmailSession(
        sanitizedData.email,
        sanitizedData.password
      );

      return { user, session };
    }, 'registerWithEmail');
  }

  /**
   * Login user with email and password
   */
  static async loginWithEmail(email: string, password: string): Promise<AuthResult> {
    return AppwriteService.executeWithErrorHandling(async () => {
      // Validate input
      if (!AppwriteUtils.isValidEmail(email)) {
        throw new Error('Invalid email format');
      }

      const sanitizedEmail = email.toLowerCase().trim();

      // Create session
      const session = await account.createEmailSession(sanitizedEmail, password);
      
      // Get user details
      const user = await account.get();

      return { user, session };
    }, 'loginWithEmail');
  }

  /**
   * Register/Login with phone number (send OTP)
   */
  static async initiatePhoneAuth(data: PhoneAuthData): Promise<OTPResult> {
    return AppwriteService.executeWithErrorHandling(async () => {
      // Validate phone number
      if (!AppwriteUtils.isValidPhoneNumber(data.phone)) {
        throw new Error('Invalid phone number format');
      }

      // Format phone number
      const formattedPhone = `+91${data.phone.replace(/\D/g, '')}`;

      // Create phone session (sends OTP)
      const token = await account.createPhoneSession(ID.unique(), formattedPhone);

      return {
        userId: token.userId,
        secret: token.secret,
        expire: token.expire
      };
    }, 'initiatePhoneAuth');
  }

  /**
   * Verify phone OTP and complete authentication
   */
  static async verifyPhoneOTP(
    userId: string, 
    secret: string, 
    otp: string
  ): Promise<AuthResult> {
    return AppwriteService.executeWithErrorHandling(async () => {
      // Validate OTP format
      if (!/^\d{6}$/.test(otp)) {
        throw new Error('OTP must be 6 digits');
      }

      // Verify OTP and create session
      const session = await account.updatePhoneSession(userId, secret, otp);
      
      // Get user details
      const user = await account.get();

      return { user, session };
    }, 'verifyPhoneOTP');
  }

  /**
   * Get current authenticated user
   */
  static async getCurrentUser(): Promise<Models.User<Models.Preferences> | null> {
    return AppwriteService.executeWithErrorHandling(async () => {
      try {
        return await account.get();
      } catch (error: any) {
        // If user is not authenticated, return null instead of throwing
        if (error.code === 401) {
          return null;
        }
        throw error;
      }
    }, 'getCurrentUser');
  }

  /**
   * Get current session
   */
  static async getCurrentSession(): Promise<Models.Session | null> {
    return AppwriteService.executeWithErrorHandling(async () => {
      try {
        return await account.getSession('current');
      } catch (error: any) {
        // If no session exists, return null
        if (error.code === 401) {
          return null;
        }
        throw error;
      }
    }, 'getCurrentSession');
  }

  /**
   * Get session information (user + session)
   */
  static async getSessionInfo(): Promise<SessionInfo> {
    try {
      const [user, session] = await Promise.all([
        this.getCurrentUser(),
        this.getCurrentSession()
      ]);

      return {
        user,
        session,
        isAuthenticated: !!(user && session)
      };
    } catch (error) {
      return {
        user: null,
        session: null,
        isAuthenticated: false
      };
    }
  }

  /**
   * Logout user (delete current session)
   */
  static async logout(): Promise<void> {
    return AppwriteService.executeWithErrorHandling(async () => {
      await account.deleteSession('current');
    }, 'logout');
  }

  /**
   * Logout from all devices (delete all sessions)
   */
  static async logoutFromAllDevices(): Promise<void> {
    return AppwriteService.executeWithErrorHandling(async () => {
      await account.deleteSessions();
    }, 'logoutFromAllDevices');
  }

  /**
   * Update user name
   */
  static async updateName(name: string): Promise<Models.User<Models.Preferences>> {
    return AppwriteService.executeWithErrorHandling(async () => {
      if (name.trim().length < 2) {
        throw new Error('Name must be at least 2 characters long');
      }

      const sanitizedName = AppwriteUtils.sanitizeInput(name);
      return await account.updateName(sanitizedName);
    }, 'updateName');
  }

  /**
   * Update user email
   */
  static async updateEmail(email: string, password: string): Promise<Models.User<Models.Preferences>> {
    return AppwriteService.executeWithErrorHandling(async () => {
      if (!AppwriteUtils.isValidEmail(email)) {
        throw new Error('Invalid email format');
      }

      const sanitizedEmail = email.toLowerCase().trim();
      return await account.updateEmail(sanitizedEmail, password);
    }, 'updateEmail');
  }

  /**
   * Update user password
   */
  static async updatePassword(newPassword: string, oldPassword: string): Promise<Models.User<Models.Preferences>> {
    return AppwriteService.executeWithErrorHandling(async () => {
      if (newPassword.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }

      return await account.updatePassword(newPassword, oldPassword);
    }, 'updatePassword');
  }

  /**
   * Update user phone
   */
  static async updatePhone(phone: string, password: string): Promise<Models.User<Models.Preferences>> {
    return AppwriteService.executeWithErrorHandling(async () => {
      if (!AppwriteUtils.isValidPhoneNumber(phone)) {
        throw new Error('Invalid phone number format');
      }

      const formattedPhone = `+91${phone.replace(/\D/g, '')}`;
      return await account.updatePhone(formattedPhone, password);
    }, 'updatePhone');
  }

  /**
   * Send password recovery email
   */
  static async sendPasswordRecovery(email: string): Promise<Models.Token> {
    return AppwriteService.executeWithErrorHandling(async () => {
      if (!AppwriteUtils.isValidEmail(email)) {
        throw new Error('Invalid email format');
      }

      const sanitizedEmail = email.toLowerCase().trim();
      
      // You'll need to set up the recovery URL in your Appwrite console
      const recoveryUrl = `${window.location.origin}/auth/recovery`;
      
      return await account.createRecovery(sanitizedEmail, recoveryUrl);
    }, 'sendPasswordRecovery');
  }

  /**
   * Complete password recovery
   */
  static async completePasswordRecovery(
    userId: string,
    secret: string,
    newPassword: string
  ): Promise<Models.Token> {
    return AppwriteService.executeWithErrorHandling(async () => {
      if (newPassword.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }

      return await account.updateRecovery(userId, secret, newPassword);
    }, 'completePasswordRecovery');
  }

  /**
   * Send email verification
   */
  static async sendEmailVerification(): Promise<Models.Token> {
    return AppwriteService.executeWithErrorHandling(async () => {
      const verificationUrl = `${window.location.origin}/auth/verify`;
      return await account.createVerification(verificationUrl);
    }, 'sendEmailVerification');
  }

  /**
   * Verify email
   */
  static async verifyEmail(userId: string, secret: string): Promise<Models.Token> {
    return AppwriteService.executeWithErrorHandling(async () => {
      return await account.updateVerification(userId, secret);
    }, 'verifyEmail');
  }

  /**
   * Send phone verification
   */
  static async sendPhoneVerification(): Promise<Models.Token> {
    return AppwriteService.executeWithErrorHandling(async () => {
      return await account.createPhoneVerification();
    }, 'sendPhoneVerification');
  }

  /**
   * Verify phone
   */
  static async verifyPhone(userId: string, secret: string): Promise<Models.Token> {
    return AppwriteService.executeWithErrorHandling(async () => {
      return await account.updatePhoneVerification(userId, secret);
    }, 'verifyPhone');
  }

  /**
   * Get user preferences
   */
  static async getPreferences(): Promise<Models.Preferences> {
    return AppwriteService.executeWithErrorHandling(async () => {
      return await account.getPrefs();
    }, 'getPreferences');
  }

  /**
   * Update user preferences
   */
  static async updatePreferences(preferences: object): Promise<Models.User<Models.Preferences>> {
    return AppwriteService.executeWithErrorHandling(async () => {
      return await account.updatePrefs(preferences);
    }, 'updatePreferences');
  }

  /**
   * Check if user is authenticated
   */
  static async isAuthenticated(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      return !!user;
    } catch {
      return false;
    }
  }

  /**
   * Get all active sessions
   */
  static async getSessions(): Promise<Models.SessionList> {
    return AppwriteService.executeWithErrorHandling(async () => {
      return await account.listSessions();
    }, 'getSessions');
  }

  /**
   * Delete specific session
   */
  static async deleteSession(sessionId: string): Promise<void> {
    return AppwriteService.executeWithErrorHandling(async () => {
      await account.deleteSession(sessionId);
    }, 'deleteSession');
  }
}