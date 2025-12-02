export interface Show {
  name: string;
  slug: string;
  created_time: string;
  picture_key: string;
  tags: string[];
  category: string;
  audio_length: number;
  description?: string;
}
