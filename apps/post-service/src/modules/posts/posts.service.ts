import type {
  CreatePostRequest,
  CreatePostResponse,
  DeletePostResponse,
  GetPostResponse,
  ListPostsRequest,
  ListPostsResponse,
} from "@repo/contracts";
import { PostsError } from "@/modules/posts/posts.errors";
import { toPostDto } from "@/modules/posts/posts.mapper";
import type { PostsRepository } from "@/modules/posts/posts.repository";

export interface PostsServicePort {
  create(
    authorId: string,
    input: CreatePostRequest & {
      media?: Array<{
        mediaId: string;
        url: string;
        mediaType: string;
        mimeType: string;
      }>;
    },
  ): Promise<CreatePostResponse>;
  getById(id: string): Promise<GetPostResponse | undefined>;
  list(input: ListPostsRequest): Promise<ListPostsResponse>;
  delete(id: string, actorId: string): Promise<DeletePostResponse>;
}

export class PostsService implements PostsServicePort {
  constructor(private readonly repository: PostsRepository) {}

  async create(
    authorId: string,
    input: CreatePostRequest & {
      media?: Array<{
        mediaId: string;
        url: string;
        mediaType: string;
        mimeType: string;
      }>;
    },
  ): Promise<CreatePostResponse> {
    const media = input.media ?? [];

    if (media.length > 4) {
      throw new PostsError("Posts can include up to 4 media items", 400, "POST_MEDIA_LIMIT");
    }

    if (new Set(media.map((item) => item.mediaId)).size !== media.length) {
      throw new PostsError("Post media cannot contain duplicates", 400, "POST_MEDIA_DUPLICATE");
    }

    const post = await this.repository.create({
      authorId,
      content: input.content,
      replyToPostId: input.replyToPostId ?? null,
      repostOfPostId: input.repostOfPostId ?? null,
      media,
    });

    return {
      post: toPostDto(post),
    };
  }

  async getById(id: string): Promise<GetPostResponse | undefined> {
    const post = await this.repository.findById(id);

    if (!post) {
      return undefined;
    }

    return {
      post: toPostDto(post),
    };
  }

  async list(input: ListPostsRequest): Promise<ListPostsResponse> {
    const posts = await this.repository.list({
      authorId: input.authorId,
      cursor: input.cursor ? new Date(input.cursor) : undefined,
      limit: input.limit,
    });
    const visiblePosts = posts.slice(0, input.limit);
    const nextPost = posts[input.limit];

    return {
      posts: visiblePosts.map(toPostDto),
      nextCursor: nextPost?.post.createdAt.toISOString() ?? null,
    };
  }

  async delete(id: string, actorId: string): Promise<DeletePostResponse> {
    const post = await this.repository.findById(id);

    if (!post) {
      throw new PostsError("Post not found", 404, "POST_NOT_FOUND");
    }

    if (post.post.authorId !== actorId) {
      throw new PostsError(
        "Only the author can delete this post",
        403,
        "POST_FORBIDDEN",
      );
    }

    const deletedPost = await this.repository.softDelete(id);

    if (!deletedPost) {
      throw new PostsError("Post not found", 404, "POST_NOT_FOUND");
    }

    return {
      post: toPostDto(deletedPost),
    };
  }
}
