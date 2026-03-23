// ─── Post / Community Types ───
export interface Post {
  id: string;
  userId: string;
  media: string | null;
  message: string;
  createdAt: string;
  updatedAt: string;
  user?: { name: string; avatar: string | null };
  _count?: { likes: number; comments: number };
  isLiked?: boolean;
}

export interface CreatePostDto {
  message: string;
  media?: string;
}

export interface Comment {
  id: string;
  userId: string;
  postId: string;
  comment: string;
  createdAt: string;
  updatedAt: string;
  user?: { name: string; avatar: string | null };
}

export interface CreateCommentDto {
  postId: string;
  comment: string;
}
