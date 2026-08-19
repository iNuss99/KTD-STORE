export interface Address {
  id: string;
  user_id: string;
  receiver_name: string;
  phone: string;
  address_line: string;
  ward?: string;
  district?: string;
  province?: string;
  is_default: boolean;
}
