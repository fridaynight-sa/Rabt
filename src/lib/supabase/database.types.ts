// Database types, written to match supabase/migrations.
// Once the Supabase project is linked, regenerate with:
//   npx supabase gen types typescript --linked > src/lib/supabase/database.types.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Table<Row, Insert, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

type RefRow = { id: number; slug: string; name_ar: string; sort_order: number };
type RefInsert = { slug: string; name_ar: string; sort_order?: number };

export type UserRole = "merchant" | "provider" | "admin";
export type AccountStatus = "active" | "suspended";
export type ContactMethod = "whatsapp" | "call";
export type ListingStatus = "published" | "hidden";
export type ReportTarget = "provider" | "listing" | "review";
export type ReportStatus = "open" | "resolved" | "dismissed";

export type Database = {
  public: {
    Tables: {
      cities: Table<RefRow, RefInsert>;
      sectors: Table<RefRow, RefInsert>;
      categories: Table<RefRow, RefInsert>;
      profiles: Table<
        {
          id: string;
          role: UserRole;
          full_name: string;
          phone: string | null;
          status: AccountStatus;
          created_at: string;
          updated_at: string;
        },
        {
          id: string;
          role: UserRole;
          full_name: string;
          phone?: string | null;
          status?: AccountStatus;
        }
      >;
      providers: Table<
        {
          id: string;
          business_name: string;
          slug: string;
          city_id: number;
          whatsapp: string;
          services: string;
          description: string | null;
          is_verified: boolean;
          rating_avg: number;
          rating_count: number;
          search_text: string;
          created_at: string;
          updated_at: string;
        },
        {
          id: string;
          business_name: string;
          slug: string;
          city_id: number;
          whatsapp: string;
          services: string;
          description?: string | null;
        }
      >;
      provider_sectors: Table<
        { provider_id: string; sector_id: number },
        { provider_id: string; sector_id: number }
      >;
      provider_categories: Table<
        { provider_id: string; category_id: number },
        { provider_id: string; category_id: number }
      >;
      portfolio_images: Table<
        {
          id: string;
          provider_id: string;
          storage_key: string;
          sort_order: number;
          created_at: string;
        },
        { provider_id: string; storage_key: string; sort_order?: number }
      >;
      listings: Table<
        {
          id: string;
          provider_id: string;
          title: string;
          description: string;
          price: number | null;
          city_id: number;
          category_id: number;
          contact_method: ContactMethod;
          status: ListingStatus;
          search_text: string;
          created_at: string;
          updated_at: string;
        },
        {
          provider_id: string;
          title: string;
          description: string;
          price?: number | null;
          city_id: number;
          category_id: number;
          contact_method?: ContactMethod;
        }
      >;
      listing_images: Table<
        {
          id: string;
          listing_id: string;
          storage_key: string;
          sort_order: number;
          created_at: string;
        },
        { listing_id: string; storage_key: string; sort_order?: number }
      >;
      reviews: Table<
        {
          id: string;
          provider_id: string;
          merchant_id: string;
          rating: number;
          comment: string | null;
          created_at: string;
          updated_at: string;
        },
        { provider_id: string; merchant_id: string; rating: number; comment?: string | null }
      >;
      reports: Table<
        {
          id: string;
          reporter_id: string;
          target_type: ReportTarget;
          target_id: string;
          reason: string;
          status: ReportStatus;
          resolved_by: string | null;
          resolved_at: string | null;
          created_at: string;
        },
        { reporter_id: string; target_type: ReportTarget; target_id: string; reason: string }
      >;
      page_views_daily: Table<
        { day: string; path: string; views: number },
        { day: string; path: string; views?: number }
      >;
      audit_log: Table<
        {
          id: number;
          actor_id: string | null;
          action: string;
          target_type: string | null;
          target_id: string | null;
          details: Json;
          created_at: string;
        },
        {
          actor_id?: string | null;
          action: string;
          target_type?: string | null;
          target_id?: string | null;
          details?: Json;
        }
      >;
    };
    Views: { [_ in never]: never };
    Functions: {
      current_user_role: { Args: never; Returns: UserRole | null };
      is_admin: { Args: never; Returns: boolean };
      is_account_active: { Args: { account_id: string }; Returns: boolean };
      get_login_email_for_phone: { Args: { p_phone: string }; Returns: string | null };
      record_page_view: { Args: { p_path: string }; Returns: undefined };
      normalize_search_text: { Args: { t: string }; Returns: string };
      search_pattern: { Args: { p_query: string }; Returns: string | null };
      search_listings: {
        Args: {
          p_query?: string | null;
          p_city_id?: number | null;
          p_category_id?: number | null;
          p_sector_id?: number | null;
          p_provider_id?: string | null;
          p_sort?: string;
          p_limit?: number;
          p_offset?: number;
        };
        Returns: {
          id: string;
          title: string;
          price: number | null;
          city_id: number;
          category_id: number;
          contact_method: ContactMethod;
          created_at: string;
          provider_id: string;
          provider_name: string;
          provider_slug: string;
          provider_verified: boolean;
          cover_key: string | null;
          total_count: number;
        }[];
      };
      search_providers: {
        Args: {
          p_query?: string | null;
          p_city_id?: number | null;
          p_category_id?: number | null;
          p_sector_id?: number | null;
          p_sort?: string;
          p_limit?: number;
          p_offset?: number;
        };
        Returns: {
          id: string;
          slug: string;
          business_name: string;
          city_id: number;
          services: string;
          is_verified: boolean;
          rating_avg: number;
          rating_count: number;
          cover_key: string | null;
          total_count: number;
        }[];
      };
      get_provider_reviews: {
        Args: { p_provider_id: string; p_limit?: number; p_offset?: number };
        Returns: {
          id: string;
          rating: number;
          comment: string | null;
          created_at: string;
          updated_at: string;
          reviewer_name: string;
          is_mine: boolean;
        }[];
      };
      admin_list_accounts: {
        Args: {
          p_role?: UserRole | null;
          p_status?: AccountStatus | null;
          p_query?: string | null;
          p_limit?: number;
          p_offset?: number;
        };
        Returns: {
          id: string;
          role: UserRole;
          full_name: string;
          email: string;
          phone: string | null;
          status: AccountStatus;
          created_at: string;
          provider_slug: string | null;
          provider_verified: boolean | null;
          total_count: number;
        }[];
      };
      admin_set_account_status: {
        Args: { p_user_id: string; p_status: AccountStatus };
        Returns: undefined;
      };
      admin_set_provider_verified: {
        Args: { p_provider_id: string; p_verified: boolean };
        Returns: undefined;
      };
      admin_log: {
        Args: { p_action: string; p_target_type: string; p_target_id: string; p_details?: Json };
        Returns: undefined;
      };
      admin_set_listing_status: {
        Args: { p_listing_id: string; p_status: ListingStatus };
        Returns: undefined;
      };
      admin_delete_review: { Args: { p_review_id: string }; Returns: undefined };
      admin_resolve_report: {
        Args: { p_report_id: string; p_status: ReportStatus };
        Returns: undefined;
      };
      admin_list_reports: {
        Args: { p_status?: ReportStatus | null; p_limit?: number; p_offset?: number };
        Returns: {
          id: string;
          target_type: ReportTarget;
          target_id: string;
          target_label: string | null;
          target_path: string | null;
          target_owner_id: string | null;
          reason: string;
          status: ReportStatus;
          created_at: string;
          reporter_name: string;
          total_count: number;
        }[];
      };
      admin_save_reference: {
        Args: {
          p_kind: "cities" | "sectors" | "categories";
          p_id: number | null;
          p_slug: string;
          p_name_ar: string;
          p_sort_order?: number;
        };
        Returns: number;
      };
      admin_stats: { Args: { p_days?: number }; Returns: Json };
      set_provider_tags: {
        Args: { p_sector_ids: number[]; p_category_ids: number[] };
        Returns: undefined;
      };
    };
    Enums: {
      user_role: UserRole;
      account_status: AccountStatus;
      contact_method: ContactMethod;
      listing_status: ListingStatus;
      report_target: ReportTarget;
      report_status: ReportStatus;
    };
    CompositeTypes: { [_ in never]: never };
  };
};
