import { supabase } from '../lib/supabaseClient';
import { Profile, Result } from '../types';

export class AuthService {
  static async getCurrentUser(): Promise<Result<any>> {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) return { success: false, error: new Error(error.message) };
      return { success: true, data: data.user };
    } catch (e: any) {
      return { success: false, error: e };
    }
  }

  static async getProfile(profileId: string): Promise<Result<Profile | null>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .is('deleted_at', null)
        .single();

      if (error) return { success: false, error: new Error(error.message) };
      return { success: true, data };
    } catch (e: any) {
      return { success: false, error: e };
    }
  }

  static async updateProfile(profileId: string, profileData: Partial<Profile>): Promise<Result<Profile>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', profileId)
        .select()
        .single();

      if (error) return { success: false, error: new Error(error.message) };
      return { success: true, data: data };
    } catch (e: any) {
      return { success: false, error: e };
    }
  }

  static async signIn(email: string, password: string): Promise<Result<any>> {
    try {
      if (!password) {
        return { success: false, error: new Error('Password is required') };
      }
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      if (error) return { success: false, error: new Error(error.message) };
      return { success: true, data: data.user };
    } catch (e: any) {
      return { success: false, error: e };
    }
  }

  static async signUp(email: string, password: string, fullName?: string): Promise<Result<any>> {
    try {
      if (!password) {
        return { success: false, error: new Error('Password is required') };
      }
      if (password.length < 6) {
        return { success: false, error: new Error('Password must be at least 6 characters') };
      }
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName || email.split('@')[0] }
        }
      });
      if (error) return { success: false, error: new Error(error.message) };
      return { success: true, data: data.user };
    } catch (e: any) {
      return { success: false, error: e };
    }
  }

  static async signInWithGoogle(): Promise<Result<any>> {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        }
      });
      if (error) return { success: false, error: new Error(error.message) };
      return { success: true, data };
    } catch (e: any) {
      return { success: false, error: e };
    }
  }

  static async resetPassword(email: string): Promise<Result<any>> {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/`,
      });
      if (error) return { success: false, error: new Error(error.message) };
      return { success: true, data };
    } catch (e: any) {
      return { success: false, error: e };
    }
  }

  static async updatePassword(password: string): Promise<Result<any>> {
    try {
      const { data, error } = await supabase.auth.updateUser({ password });
      if (error) return { success: false, error: new Error(error.message) };
      return { success: true, data };
    } catch (e: any) {
      return { success: false, error: e };
    }
  }

  static async signOut(): Promise<Result<void>> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) return { success: false, error: new Error(error.message) };
      return { success: true, data: undefined };
    } catch (e: any) {
      return { success: false, error: e };
    }
  }

  static onAuthChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
}
