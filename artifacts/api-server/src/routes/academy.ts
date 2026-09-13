import { Router, type IRouter } from "express";
import {
  CreateLessonCommentBody,
  CreateLessonCommentParams,
  CreateLessonCommentResponse,
  ListLessonsResponse,
  ListLessonCommentsParams,
  ListLessonCommentsResponse,
  ListRecentActivityResponse,
  RecordActivityBody,
  RecordActivityResponse,
} from "@workspace/api-zod";
import { clerkClient, getAuth } from "@clerk/express";
import { requireAuth } from "../middlewares/requireAuth";
import {
  createLessonComment,
  listLessons,
  listLessonComments,
  listRecentActivity,
  recordActivity,
} from "../lib/academy";

const router: IRouter = Router();

router.get("/lessons", requireAuth, (_req, res): void => {
  res.json(ListLessonsResponse.parse(listLessons()));
});

router.get(
  "/lessons/:lessonId/comments",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = ListLessonCommentsParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const comments = await listLessonComments(params.data.lessonId);
    res.json(ListLessonCommentsResponse.parse(comments));
  },
);

router.post(
  "/lessons/:lessonId/comments",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = CreateLessonCommentParams.safeParse(req.params);
    const body = CreateLessonCommentBody.safeParse(req.body);
    if (!params.success || !body.success || body.data.content.trim().length === 0) {
      res.status(400).json({ error: "Enter a comment before posting." });
      return;
    }

    const userId = getAuth(req).userId;
    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const user = await clerkClient.users.getUser(userId);
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
    const authorName =
      fullName ||
      user.username ||
      user.primaryEmailAddress?.emailAddress.split("@")[0] ||
      "Academy learner";
    const comment = await createLessonComment(
      params.data.lessonId,
      userId,
      authorName,
      { content: body.data.content.trim() },
    );

    res.status(201).json(CreateLessonCommentResponse.parse(comment));
  },
);

router.post("/activity", requireAuth, async (req, res): Promise<void> => {
  const parsed = RecordActivityBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid activity event");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const userId = getAuth(req).userId;
  if (!userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const entry = await recordActivity(userId, parsed.data);
  res.status(201).json(RecordActivityResponse.parse(entry));
});

router.get(
  "/activity/recent",
  requireAuth,
  async (req, res): Promise<void> => {
    const userId = getAuth(req).userId;
    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const entries = await listRecentActivity(userId);
    res.json(ListRecentActivityResponse.parse(entries));
  },
);

export default router;