// Storage abstraction layer that can use either Supabase or localStorage
import { supabase } from './supabase';

export interface Block {
  id: string;
  type: "text" | "heading" | "quote" | "code" | "list" | "image" | "table";
  content: string;
  order: number;
  metadata?: Record<string, any>;
}

export interface NotionDocument {
  id: string;
  title: string;
  blocks: Block[];
  created_at: string;
  updated_at: string;
  is_public?: boolean;
  share_token?: string;
}

class StorageManager {
  private useSupabase = true;

  constructor() {
    // Test if Supabase is available
    this.testSupabaseConnection();
  }

  private async testSupabaseConnection() {
    try {
      const { error } = await supabase.from('notion_documents').select('count').limit(1);
      this.useSupabase = !error;
    } catch (err) {
      console.warn('Supabase not available, falling back to localStorage:', err);
      this.useSupabase = false;
    }
  }

  async getDocuments(): Promise<NotionDocument[]> {
    if (this.useSupabase) {
      try {
        const { data, error } = await supabase
          .from('notion_documents')
          .select('*')
          .order('updated_at', { ascending: false });
        
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.warn('Supabase query failed, falling back to localStorage:', err);
        this.useSupabase = false;
      }
    }

    // Fallback to localStorage
    const docs = localStorage.getItem('notion_documents');
    return docs ? JSON.parse(docs) : [];
  }

  async getDocument(id: string): Promise<NotionDocument | null> {
    if (this.useSupabase) {
      try {
        const { data, error } = await supabase
          .from('notion_documents')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        return data;
      } catch (err) {
        console.warn('Supabase query failed, falling back to localStorage:', err);
        this.useSupabase = false;
      }
    }

    // Fallback to localStorage
    const docs = await this.getDocuments();
    return docs.find(doc => doc.id === id) || null;
  }

  async saveDocument(doc: Partial<NotionDocument>): Promise<NotionDocument> {
    const now = new Date().toISOString();
    const docData: NotionDocument = {
      id: doc.id || `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: doc.title || 'Untitled Document',
      blocks: doc.blocks || [],
      created_at: doc.created_at || now,
      updated_at: now,
      is_public: doc.is_public || false,
      share_token: doc.share_token,
    };

    if (this.useSupabase) {
      try {
        const { data, error } = await supabase
          .from('notion_documents')
          .upsert(docData)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } catch (err) {
        console.warn('Supabase save failed, falling back to localStorage:', err);
        this.useSupabase = false;
      }
    }

    // Fallback to localStorage
    const docs = await this.getDocuments();
    const existingIndex = docs.findIndex(d => d.id === docData.id);
    
    if (existingIndex >= 0) {
      docs[existingIndex] = docData;
    } else {
      docs.unshift(docData);
    }
    
    localStorage.setItem('notion_documents', JSON.stringify(docs));
    return docData;
  }

  async deleteDocument(id: string): Promise<boolean> {
    if (this.useSupabase) {
      try {
        const { error } = await supabase
          .from('notion_documents')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        return true;
      } catch (err) {
        console.warn('Supabase delete failed, falling back to localStorage:', err);
        this.useSupabase = false;
      }
    }

    // Fallback to localStorage
    const docs = await this.getDocuments();
    const filtered = docs.filter(doc => doc.id !== id);
    localStorage.setItem('notion_documents', JSON.stringify(filtered));
    return true;
  }

  async getSharedDocument(token: string): Promise<NotionDocument | null> {
    if (this.useSupabase) {
      try {
        const { data, error } = await supabase
          .from('notion_documents')
          .select('*')
          .eq('share_token', token)
          .eq('is_public', true)
          .single();
        
        if (error) throw error;
        return data;
      } catch (err) {
        console.warn('Supabase query failed:', err);
      }
    }

    // For localStorage, we can't really share, so return null
    return null;
  }

  generateShareToken(): string {
    return `share_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
  }

  isSupabaseEnabled(): boolean {
    return this.useSupabase;
  }
}

export const storageManager = new StorageManager();