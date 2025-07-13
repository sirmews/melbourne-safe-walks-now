export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      api_rate_limits: {
        Row: {
          created_at: string | null
          endpoint: string
          id: string
          ip_address: unknown
          request_count: number | null
          window_start: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: string
          ip_address: unknown
          request_count?: number | null
          window_start?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: string
          ip_address?: unknown
          request_count?: number | null
          window_start?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          id: string
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          id: string
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      report_ratings: {
        Row: {
          created_at: string | null
          helpful: boolean | null
          id: string
          rating: number | null
          report_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          helpful?: boolean | null
          id?: string
          rating?: number | null
          report_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          helpful?: boolean | null
          id?: string
          rating?: number | null
          report_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_ratings_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "safety_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      safety_reports: {
        Row: {
          address: string | null
          category: Database["public"]["Enums"]["safety_category"]
          created_at: string | null
          description: string | null
          flagged: boolean | null
          id: string
          location: unknown
          photo_urls: string[] | null
          severity: Database["public"]["Enums"]["safety_severity"]
          title: string
          updated_at: string | null
          user_id: string | null
          verified: boolean | null
        }
        Insert: {
          address?: string | null
          category: Database["public"]["Enums"]["safety_category"]
          created_at?: string | null
          description?: string | null
          flagged?: boolean | null
          id?: string
          location: unknown
          photo_urls?: string[] | null
          severity?: Database["public"]["Enums"]["safety_severity"]
          title: string
          updated_at?: string | null
          user_id?: string | null
          verified?: boolean | null
        }
        Update: {
          address?: string | null
          category?: Database["public"]["Enums"]["safety_category"]
          created_at?: string | null
          description?: string | null
          flagged?: boolean | null
          id?: string
          location?: unknown
          photo_urls?: string[] | null
          severity?: Database["public"]["Enums"]["safety_severity"]
          title?: string
          updated_at?: string | null
          user_id?: string | null
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "safety_reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      analyze_route_safety_detailed: {
        Args: {
          route_coordinates: Json
          analysis_buffer_km?: number
          current_hour?: number
          current_day?: number
          max_report_age_hours?: number
        }
        Returns: Json
      }
      debug_analyze_route_safety: {
        Args: { route_coordinates: Json; analysis_buffer_km?: number }
        Returns: Json
      }
      find_dangerous_areas_along_route: {
        Args: {
          origin_lat: number
          origin_lng: number
          dest_lat: number
          dest_lng: number
          corridor_width_km?: number
          current_hour?: number
          max_report_age_hours?: number
        }
        Returns: {
          id: string
          location_lat: number
          location_lng: number
          category: Database["public"]["Enums"]["safety_category"]
          severity: Database["public"]["Enums"]["safety_severity"]
          weighted_risk_score: number
          distance_to_route_km: number
          buffer_radius_km: number
        }[]
      }
      generate_avoidance_waypoints: {
        Args: {
          origin_lat: number
          origin_lng: number
          dest_lat: number
          dest_lng: number
          dangerous_areas: Json
          max_detour_ratio?: number
          min_clearance_km?: number
        }
        Returns: {
          waypoint_lng: number
          waypoint_lat: number
          waypoint_order: number
        }[]
      }
      get_reports_in_bounds: {
        Args: { sw_lat: number; sw_lng: number; ne_lat: number; ne_lng: number }
        Returns: {
          id: string
          location_lat: number
          location_lng: number
          category: string
          severity: string
          title: string
          description: string
          created_at: string
          rating_avg: number
          rating_count: number
          verified: boolean
          flagged: boolean
        }[]
      }
      test_safety_reports_exists: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_reports: number
          sample_report: Json
        }[]
      }
    }
    Enums: {
      safety_category:
        | "unlit_street"
        | "dangerous_area"
        | "facility_risk"
        | "crime_hotspot"
        | "poor_visibility"
        | "unsafe_infrastructure"
        | "suspicious_activity"
        | "well_lit_safe"
        | "police_presence"
        | "busy_safe_area"
      safety_severity: "low" | "medium" | "high" | "critical"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      safety_category: [
        "unlit_street",
        "dangerous_area",
        "facility_risk",
        "crime_hotspot",
        "poor_visibility",
        "unsafe_infrastructure",
        "suspicious_activity",
        "well_lit_safe",
        "police_presence",
        "busy_safe_area",
      ],
      safety_severity: ["low", "medium", "high", "critical"],
    },
  },
} as const
