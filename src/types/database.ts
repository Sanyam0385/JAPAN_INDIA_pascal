// Typed Supabase Database Schema Definitions for CIRCULO
// Matches Supabase migrations 001, 002, 003, and 004

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole =
  | 'household'
  | 'formal_collector'
  | 'informal_picker'
  | 'municipal_admin'
  | 'recycler';

export type PickupJobStatus =
  | 'listed'
  | 'rate_proposed'
  | 'rate_locked'
  | 'claimed'
  | 'en_route'
  | 'weighed'
  | 'handed_to_recycler'
  | 'completed'
  | 'disputed'
  | 'cancelled';

export type RateOfferStatus = 'pending' | 'accepted' | 'countered' | 'rejected';
export type ReceiptPaymentStatus = 'pending' | 'cleared_upi_simulated';
export type QualityGrade = 'clean' | 'mixed' | 'contaminated';
export type DisputeReason = 'weight' | 'price' | 'payment' | 'other';
export type DisputeStatus = 'open' | 'under_review' | 'resolved';
export type IssueType = 'missed_pickup' | 'contamination' | 'overflow' | 'other';
export type IssueStatus = 'open' | 'investigating' | 'resolved';
export type ComplaintStatus =
  | 'submitted'
  | 'acknowledged'
  | 'assigned'
  | 'in_progress'
  | 'resolved'
  | 'rejected_with_reason';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string;
          name: string | null;
          role: UserRole;
          locality: string | null;
          ward: string | null;
          city_key: string | null;
          lat: number | null;
          lng: number | null;
          phone: string | null;
          language: string | null;
          avatar_url: string | null;
          share_live_location: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string;
          name?: string | null;
          role?: UserRole;
          locality?: string | null;
          ward?: string | null;
          city_key?: string | null;
          lat?: number | null;
          lng?: number | null;
          phone?: string | null;
          language?: string | null;
          avatar_url?: string | null;
          share_live_location?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string;
          name?: string | null;
          role?: UserRole;
          locality?: string | null;
          ward?: string | null;
          city_key?: string | null;
          lat?: number | null;
          lng?: number | null;
          phone?: string | null;
          language?: string | null;
          avatar_url?: string | null;
          share_live_location?: boolean;
          updated_at?: string;
        };
      };
      pickup_jobs: {
        Row: {
          id: string;
          household_id: string;
          household_name: string | null;
          household_address: string | null;
          picker_id: string | null;
          picker_name: string | null;
          material: string;
          estimated_kg: number;
          status: PickupJobStatus;
          proposed_rate_per_kg: number | null;
          locked_rate_per_kg: number | null;
          measured_kg: number | null;
          pickup_window: string;
          ward: string;
          city_key: string;
          lat: number | null;
          lng: number | null;
          notes: string | null;
          destination_id: string | null;
          destination_name: string | null;
          receipt_id: string | null;
          dispute_id: string | null;
          qr_code: string | null;
          pin: string | null;
          has_contamination: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          household_name?: string | null;
          household_address?: string | null;
          picker_id?: string | null;
          picker_name?: string | null;
          material: string;
          estimated_kg: number;
          status?: PickupJobStatus;
          proposed_rate_per_kg?: number | null;
          locked_rate_per_kg?: number | null;
          measured_kg?: number | null;
          pickup_window?: string;
          ward: string;
          city_key?: string;
          lat?: number | null;
          lng?: number | null;
          notes?: string | null;
          destination_id?: string | null;
          destination_name?: string | null;
          receipt_id?: string | null;
          dispute_id?: string | null;
          qr_code?: string | null;
          pin?: string | null;
          has_contamination?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          household_name?: string | null;
          household_address?: string | null;
          picker_id?: string | null;
          picker_name?: string | null;
          material?: string;
          estimated_kg?: number;
          status?: PickupJobStatus;
          proposed_rate_per_kg?: number | null;
          locked_rate_per_kg?: number | null;
          measured_kg?: number | null;
          pickup_window?: string;
          ward?: string;
          city_key?: string;
          lat?: number | null;
          lng?: number | null;
          notes?: string | null;
          destination_id?: string | null;
          destination_name?: string | null;
          receipt_id?: string | null;
          dispute_id?: string | null;
          qr_code?: string | null;
          pin?: string | null;
          has_contamination?: boolean;
          updated_at?: string;
        };
      };
      rate_offers: {
        Row: {
          id: string;
          job_id: string;
          proposed_by: 'household' | 'picker';
          rate_per_kg: number;
          status: RateOfferStatus;
          counter_offer: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          proposed_by: 'household' | 'picker';
          rate_per_kg: number;
          status?: RateOfferStatus;
          counter_offer?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          job_id?: string;
          proposed_by?: 'household' | 'picker';
          rate_per_kg?: number;
          status?: RateOfferStatus;
          counter_offer?: Json | null;
          updated_at?: string;
        };
      };
      receipts: {
        Row: {
          id: string;
          job_id: string | null;
          receipt_number: string;
          household_id: string | null;
          picker_id: string | null;
          recycler_id: string | null;
          material: string;
          measured_kg: number;
          rate_per_kg: number;
          line_items: Json;
          total: number;
          payment_status: ReceiptPaymentStatus;
          issued_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          job_id?: string | null;
          receipt_number: string;
          household_id?: string | null;
          picker_id?: string | null;
          recycler_id?: string | null;
          material: string;
          measured_kg: number;
          rate_per_kg: number;
          line_items?: Json;
          total: number;
          payment_status?: ReceiptPaymentStatus;
          issued_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          job_id?: string | null;
          receipt_number?: string;
          household_id?: string | null;
          picker_id?: string | null;
          recycler_id?: string | null;
          material?: string;
          measured_kg?: number;
          rate_per_kg?: number;
          line_items?: Json;
          total?: number;
          payment_status?: ReceiptPaymentStatus;
          updated_at?: string;
        };
      };
      recyclers: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          address: string;
          locality: string | null;
          ward: string | null;
          city_key: string;
          accepted_materials: string[];
          hours: string;
          phone: string | null;
          rating: number;
          is_verified: boolean;
          price_list: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          address: string;
          locality?: string | null;
          ward?: string | null;
          city_key?: string;
          accepted_materials?: string[];
          hours?: string;
          phone?: string | null;
          rating?: number;
          is_verified?: boolean;
          price_list?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string;
          address?: string;
          locality?: string | null;
          ward?: string | null;
          city_key?: string;
          accepted_materials?: string[];
          hours?: string;
          phone?: string | null;
          rating?: number;
          is_verified?: boolean;
          price_list?: Json;
          updated_at?: string;
        };
      };
      recycler_intakes: {
        Row: {
          id: string;
          job_id: string;
          recycler_id: string;
          picker_id: string | null;
          recycler_name: string | null;
          declared_kg: number;
          confirmed_kg: number;
          quality_grade: QualityGrade;
          contamination_note: string | null;
          deduction_amount: number;
          settlement_amount: number;
          status: string;
          created_at: string;
          settled_at: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          recycler_id: string;
          picker_id?: string | null;
          recycler_name?: string | null;
          declared_kg: number;
          confirmed_kg: number;
          quality_grade?: QualityGrade;
          contamination_note?: string | null;
          deduction_amount?: number;
          settlement_amount?: number;
          status?: string;
          created_at?: string;
          settled_at?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          job_id?: string;
          recycler_id?: string;
          picker_id?: string | null;
          recycler_name?: string | null;
          declared_kg?: number;
          confirmed_kg?: number;
          quality_grade?: QualityGrade;
          contamination_note?: string | null;
          deduction_amount?: number;
          settlement_amount?: number;
          status?: string;
          settled_at?: string | null;
          updated_at?: string;
        };
      };
      disputes: {
        Row: {
          id: string;
          job_id: string;
          raised_by_role: string;
          raised_by_user_id: string;
          reason: DisputeReason;
          notes: string;
          status: DisputeStatus;
          admin_note: string | null;
          resolution: string | null;
          adjusted_total: number | null;
          created_at: string;
          updated_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          job_id: string;
          raised_by_role: string;
          raised_by_user_id: string;
          reason: DisputeReason;
          notes: string;
          status?: DisputeStatus;
          admin_note?: string | null;
          resolution?: string | null;
          adjusted_total?: number | null;
          created_at?: string;
          updated_at?: string;
          resolved_at?: string | null;
        };
        Update: {
          id?: string;
          job_id?: string;
          raised_by_role?: string;
          raised_by_user_id?: string;
          reason?: DisputeReason;
          notes?: string;
          status?: DisputeStatus;
          admin_note?: string | null;
          resolution?: string | null;
          adjusted_total?: number | null;
          updated_at?: string;
          resolved_at?: string | null;
        };
      };
      issues: {
        Row: {
          id: string;
          raised_by_role: string;
          raised_by_user_id: string | null;
          locality: string | null;
          ward: string | null;
          city_key: string;
          type: IssueType;
          note: string;
          status: IssueStatus;
          created_at: string;
          updated_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          raised_by_role: string;
          raised_by_user_id?: string | null;
          locality?: string | null;
          ward?: string | null;
          city_key?: string;
          type: IssueType;
          note: string;
          status?: IssueStatus;
          created_at?: string;
          updated_at?: string;
          resolved_at?: string | null;
        };
        Update: {
          id?: string;
          raised_by_role?: string;
          raised_by_user_id?: string | null;
          locality?: string | null;
          ward?: string | null;
          city_key?: string;
          type?: IssueType;
          note?: string;
          status?: IssueStatus;
          updated_at?: string;
          resolved_at?: string | null;
        };
      };
      complaints: {
        Row: {
          id: string;
          reference_number: string;
          user_id: string;
          category: string;
          description: string;
          locality: string;
          ward: string | null;
          city_key: string;
          status: ComplaintStatus;
          resolution: string | null;
          created_at: string;
          updated_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          reference_number: string;
          user_id: string;
          category: string;
          description: string;
          locality: string;
          ward?: string | null;
          city_key?: string;
          status?: ComplaintStatus;
          resolution?: string | null;
          created_at?: string;
          updated_at?: string;
          resolved_at?: string | null;
        };
        Update: {
          id?: string;
          reference_number?: string;
          user_id?: string;
          category?: string;
          description?: string;
          locality?: string;
          ward?: string | null;
          city_key?: string;
          status?: ComplaintStatus;
          resolution?: string | null;
          updated_at?: string;
          resolved_at?: string | null;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: string;
          job_id: string | null;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          message: string;
          type?: string;
          job_id?: string | null;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          message?: string;
          type?: string;
          job_id?: string | null;
          read?: boolean;
        };
      };
      live_locations: {
        Row: {
          user_id: string;
          job_id: string | null;
          role: string | null;
          lat: number;
          lng: number;
          accuracy: number | null;
          heading: number | null;
          speed: number | null;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          job_id?: string | null;
          role?: string | null;
          lat: number;
          lng: number;
          accuracy?: number | null;
          heading?: number | null;
          speed?: number | null;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          job_id?: string | null;
          role?: string | null;
          lat?: number;
          lng?: number;
          accuracy?: number | null;
          heading?: number | null;
          speed?: number | null;
          updated_at?: string;
        };
      };
      collector_routes: {
        Row: {
          id: string;
          collector_id: string | null;
          collector_name: string;
          vehicle_number: string | null;
          shift_date: string;
          ward: string;
          city_key: string;
          truck_capacity_kg: number;
          current_load_kg: number;
          status: 'active' | 'completed' | 'paused';
          total_stops: number;
          completed_stops: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          collector_id?: string | null;
          collector_name?: string;
          vehicle_number?: string | null;
          shift_date?: string;
          ward?: string;
          city_key?: string;
          truck_capacity_kg?: number;
          current_load_kg?: number;
          status?: 'active' | 'completed' | 'paused';
          total_stops?: number;
          completed_stops?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          collector_id?: string | null;
          collector_name?: string;
          vehicle_number?: string | null;
          shift_date?: string;
          ward?: string;
          city_key?: string;
          truck_capacity_kg?: number;
          current_load_kg?: number;
          status?: 'active' | 'completed' | 'paused';
          total_stops?: number;
          completed_stops?: number;
          updated_at?: string;
        };
      };
      route_stops: {
        Row: {
          id: string;
          route_id: string;
          sequence: number;
          household_id: string | null;
          house_number: string;
          address: string;
          locality: string;
          ward: string | null;
          lat: number;
          lng: number;
          waste_type: 'wet' | 'dry' | 'recyclable' | 'hazardous';
          time_slot: string;
          status: 'pending' | 'current' | 'completed' | 'skipped';
          collected_kg: number | null;
          segregation_rating: number | null;
          completed_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          route_id: string;
          sequence: number;
          household_id?: string | null;
          house_number: string;
          address: string;
          locality?: string;
          ward?: string | null;
          lat: number;
          lng: number;
          waste_type?: 'wet' | 'dry' | 'recyclable' | 'hazardous';
          time_slot?: string;
          status?: 'pending' | 'current' | 'completed' | 'skipped';
          collected_kg?: number | null;
          segregation_rating?: number | null;
          completed_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          route_id?: string;
          sequence?: number;
          household_id?: string | null;
          house_number?: string;
          address?: string;
          locality?: string;
          ward?: string | null;
          lat?: number;
          lng?: number;
          waste_type?: 'wet' | 'dry' | 'recyclable' | 'hazardous';
          time_slot?: string;
          status?: 'pending' | 'current' | 'completed' | 'skipped';
          collected_kg?: number | null;
          segregation_rating?: number | null;
          completed_at?: string | null;
          notes?: string | null;
          updated_at?: string;
        };
      };
    };
    Functions: {
      claim_job: {
        Args: { p_job_id: string };
        Returns: boolean;
      };
      current_role: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
    };
  };
}
