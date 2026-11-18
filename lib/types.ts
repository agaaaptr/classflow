
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "class_rates": {
                  Row: {
                    "class_id": string,"student_rate_rp": number,"tutor_rate_rp": number
                  }
                  ComputedFields: never
                  Insert: {
                    "class_id": string,"student_rate_rp": number,"tutor_rate_rp": number
                  }
                  Update: {
                    "class_id"?: string,"student_rate_rp"?: number,"tutor_rate_rp"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "class_rates_class_id_fkey"
      columns: ["class_id"]
isOneToOne: true
      referencedRelation: "classes"
      referencedColumns: ["id"]
    }
                  ]
                },"classes": {
                  Row: {
                    "capacity": number,"created_at": string,"id": string,"name": string,"package_minutes": number,"tutor_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "capacity": number,"created_at"?: string,"id"?: string,"name": string,"package_minutes": number,"tutor_id": string
                  }
                  Update: {
                    "capacity"?: number,"created_at"?: string,"id"?: string,"name"?: string,"package_minutes"?: number,"tutor_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "classes_tutor_id_fkey"
      columns: ["tutor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"enrollments": {
                  Row: {
                    "amount_rp": number,"class_id": string,"created_at": string,"id": string,"package_minutes": number,"status": string,"student_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "amount_rp": number,"class_id": string,"created_at"?: string,"id"?: string,"package_minutes": number,"status"?: string,"student_id": string
                  }
                  Update: {
                    "amount_rp"?: number,"class_id"?: string,"created_at"?: string,"id"?: string,"package_minutes"?: number,"status"?: string,"student_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "enrollments_class_id_fkey"
      columns: ["class_id"]
isOneToOne: false
      referencedRelation: "classes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "enrollments_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"invoices": {
                  Row: {
                    "amount_rp": number,"cancelled_at": string | null,"cancelled_by": string | null,"created_at": string,"enrollment_id": string,"id": string,"paid_at": string | null,"paid_by": string | null,"status": string,"student_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "amount_rp": number,"cancelled_at"?: string | null,"cancelled_by"?: string | null,"created_at"?: string,"enrollment_id": string,"id"?: string,"paid_at"?: string | null,"paid_by"?: string | null,"status"?: string,"student_id": string
                  }
                  Update: {
                    "amount_rp"?: number,"cancelled_at"?: string | null,"cancelled_by"?: string | null,"created_at"?: string,"enrollment_id"?: string,"id"?: string,"paid_at"?: string | null,"paid_by"?: string | null,"status"?: string,"student_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "invoices_cancelled_by_fkey"
      columns: ["cancelled_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invoices_enrollment_id_fkey"
      columns: ["enrollment_id"]
isOneToOne: false
      referencedRelation: "enrollments"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invoices_paid_by_fkey"
      columns: ["paid_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invoices_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"lessons": {
                  Row: {
                    "class_id": string,"created_at": string,"ends_at": string,"id": string,"starts_at": string,"tutor_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "class_id": string,"created_at"?: string,"ends_at": string,"id"?: string,"starts_at": string,"tutor_id": string
                  }
                  Update: {
                    "class_id"?: string,"created_at"?: string,"ends_at"?: string,"id"?: string,"starts_at"?: string,"tutor_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "lessons_class_id_fkey"
      columns: ["class_id"]
isOneToOne: false
      referencedRelation: "classes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "lessons_tutor_id_fkey"
      columns: ["tutor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"logbook_entries": {
                  Row: {
                    "activities": string,"created_at": string,"id": string,"lesson_id": string,"logbook_id": string,"observation": string,"recommendation": string,"topic": string
                  }
                  ComputedFields: never
                  Insert: {
                    "activities": string,"created_at"?: string,"id"?: string,"lesson_id": string,"logbook_id": string,"observation": string,"recommendation": string,"topic": string
                  }
                  Update: {
                    "activities"?: string,"created_at"?: string,"id"?: string,"lesson_id"?: string,"logbook_id"?: string,"observation"?: string,"recommendation"?: string,"topic"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "logbook_entries_lesson_id_fkey"
      columns: ["lesson_id"]
isOneToOne: false
      referencedRelation: "lessons"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "logbook_entries_logbook_id_fkey"
      columns: ["logbook_id"]
isOneToOne: false
      referencedRelation: "logbooks"
      referencedColumns: ["id"]
    }
                  ]
                },"logbooks": {
                  Row: {
                    "approved_at": string | null,"approved_by": string | null,"class_id": string,"created_at": string,"id": string,"period": string,"status": string,"tutor_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "approved_at"?: string | null,"approved_by"?: string | null,"class_id": string,"created_at"?: string,"id"?: string,"period": string,"status"?: string,"tutor_id": string
                  }
                  Update: {
                    "approved_at"?: string | null,"approved_by"?: string | null,"class_id"?: string,"created_at"?: string,"id"?: string,"period"?: string,"status"?: string,"tutor_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "logbooks_approved_by_fkey"
      columns: ["approved_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "logbooks_class_id_fkey"
      columns: ["class_id"]
isOneToOne: false
      referencedRelation: "classes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "logbooks_tutor_id_fkey"
      columns: ["tutor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"full_name": string,"id": string,"role": Database["public"]['Enums']["app_role"]
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"full_name": string,"id": string,"role"?: Database["public"]['Enums']["app_role"]
                  }
                  Update: {
                    "created_at"?: string,"full_name"?: string,"id"?: string,"role"?: Database["public"]['Enums']["app_role"]
                  }
                  Relationships: [
                    
                  ]
                },"tutor_earnings": {
                  Row: {
                    "amount_rp": number,"class_id": string,"created_at": string,"id": string,"lesson_id": string,"logbook_id": string,"minutes": number,"rate_rp": number,"tutor_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "amount_rp": number,"class_id": string,"created_at"?: string,"id"?: string,"lesson_id": string,"logbook_id": string,"minutes": number,"rate_rp": number,"tutor_id": string
                  }
                  Update: {
                    "amount_rp"?: number,"class_id"?: string,"created_at"?: string,"id"?: string,"lesson_id"?: string,"logbook_id"?: string,"minutes"?: number,"rate_rp"?: number,"tutor_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "tutor_earnings_class_id_fkey"
      columns: ["class_id"]
isOneToOne: false
      referencedRelation: "classes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tutor_earnings_lesson_id_fkey"
      columns: ["lesson_id"]
isOneToOne: false
      referencedRelation: "lessons"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tutor_earnings_logbook_id_fkey"
      columns: ["logbook_id"]
isOneToOne: false
      referencedRelation: "logbooks"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tutor_earnings_tutor_id_fkey"
      columns: ["tutor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "approve_logbook":
{ Args: { "p_logbook_id": string }; Returns: number
                           },
"cancel_invoice":
{ Args: { "p_invoice_id": string }; Returns: undefined
                           },
"create_class":
{ Args: { "p_capacity": number,"p_name": string,"p_package_minutes": number,"p_student_rate_rp": number,"p_tutor_id": string,"p_tutor_rate_rp": number }; Returns: string
                           },
"enroll_student":
{ Args: { "p_class_id": string }; Returns: string
                           },
"logbook_earnings":
{ Args: { "p_logbook_id": string }; Returns: {
              "amount_rp": number,"lesson_id": string,"minutes": number,"rate_rp": number
            }[]
                           },
"pay_invoice":
{ Args: { "p_invoice_id": string }; Returns: undefined
                           },
"schedule_lesson":
{ Args: { "p_class_id": string,"p_ends_at": string,"p_starts_at": string }; Returns: string
                           }
          }
          Enums: {
            "app_role": "admin"|"tutor"|"student"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "app_role": ["admin", "tutor", "student"]
          }
        }
} as const
