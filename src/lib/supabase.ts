import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export type AppRole = 'admin' | 'internal_team' | 'executive' | 'client' | 'bank';
export type DocumentStatus = 'draft' | 'pending_review' | 'changes_requested' | 'approved' | 'rejected';
export type NotificationType = 'document_uploaded' | 'change_requested' | 'document_approved' | 'document_rejected' | 'new_version';
export type DocumentType = 'solicitud_prestamo' | 'liquidacion_prestamo' | 'datos_generales';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface Document {
  id: string;
  title: string;
  description?: string;
  current_version: number;
  status: DocumentStatus;
  document_type: DocumentType;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
  uploader?: Profile;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: number;
  file_path: string;
  file_name: string;
  file_size: number;
  uploaded_by: string;
  notes?: string;
  created_at: string;
  uploader?: Profile;
}

export interface Approval {
  id: string;
  document_id: string;
  version_number: number;
  requested_by: string;
  reviewed_by?: string;
  status: DocumentStatus;
  comments?: string;
  requested_at: string;
  reviewed_at?: string;
  requester?: Profile;
  reviewer?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  document_id?: string;
  read: boolean;
  created_at: string;
}

export const authHelpers = {
  async signUp(email: string, password: string, fullName: string) {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });
    
    return { data, error };
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { data, error };
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  async getCurrentSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  },
};

export const roleHelpers = {
  async getUserRoles(userId: string): Promise<AppRole[]> {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error fetching roles:', error);
      return [];
    }
    
    return data.map(r => r.role as AppRole);
  },

  async assignRole(userId: string, role: AppRole) {
    const { error } = await supabase
      .from('user_roles')
      .insert({ user_id: userId, role });
    
    return { error };
  },

  hasRole(roles: AppRole[], role: AppRole): boolean {
    return roles.includes(role);
  },
};

export const documentHelpers = {
  async getDocuments() {
    const { data, error } = await supabase
      .from('documents')
      .select(`
        *,
        uploader:profiles!documents_uploaded_by_fkey(*)
      `)
      .order('created_at', { ascending: false });
    
    return { data, error };
  },

  async getDocument(id: string) {
    const { data, error } = await supabase
      .from('documents')
      .select(`
        *,
        uploader:profiles!documents_uploaded_by_fkey(*)
      `)
      .eq('id', id)
      .single();
    
    return { data, error };
  },

  async createDocument(title: string, description: string, documentType: DocumentType, uploadedBy: string) {
    const { data, error } = await supabase
      .from('documents')
      .insert({
        title,
        description,
        document_type: documentType,
        uploaded_by: uploadedBy,
      })
      .select()
      .single();
    
    return { data, error };
  },

  async getDocumentByType(documentType: DocumentType) {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('document_type', documentType)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    return { data, error };
  },

  async incrementDocumentVersion(documentId: string, newVersion: number) {
    const { data, error } = await supabase
      .from('documents')
      .update({ 
        current_version: newVersion,
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId)
      .select()
      .single();
    
    return { data, error };
  },

  async updateDocumentStatus(id: string, status: DocumentStatus) {
    const { data, error } = await supabase
      .from('documents')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    
    return { data, error };
  },
};