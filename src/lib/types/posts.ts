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
  reaction?: string | null;
  status?: 'active' | 'archived';
}

export interface CreatePostDto {
  message: string;
  media?: string;
  status?: 'active' | 'archived';
}

export interface Comment {
  id: string;
  userId: string;
  postId: string;
  parentId?: string | null;
  comment: string;
  createdAt: string;
  updatedAt: string;
  user?: { name: string; avatar: string | null };
  _count?: { likes: number; replies?: number };
  isLiked?: boolean;
}

export interface CreateCommentDto {
  postId: string;
  comment: string;
  parentId?: string;
}

export type ReactionType =
  | 'like'
  | 'love'
  | 'haha'
  | 'wow'
  | 'sad'
  | 'angry'
  | string;

export interface PostReaction {
  id: string;
  postId: string;
  userId: string;
  type: ReactionType;
  createdAt: string;
  user?: {
    id: string;
    name: string | null;
    avatar: string | null;
  };
}
