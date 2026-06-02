export interface Video {
  id: string;
  title: string;
  slug?: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  playlistTitle?: string;
  tags?: string[];
  viewCount?: string;
  likeCount?: string;
  commentCount?: string;
}

