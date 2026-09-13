import { appendFile, readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import {
  ListLessonsResponse,
  RecordActivityBody,
  RecordActivityResponse,
} from "@workspace/api-zod";
import type {
  ActivityInput,
  ActivityLogEntry,
  Lesson,
  LessonComment,
  LessonCommentInput,
} from "@workspace/api-zod";

const activityLogPath = path.join(process.cwd(), "activity.log");
const commentsLogPath = path.join(process.cwd(), "comments.log");

const defaultVideoUrls: Record<number, string> = {
  0: "https://liveuclac-my.sharepoint.com/personal/ucacgko_ucl_ac_uk/_layouts/15/embed.aspx?UniqueId=60542330-3abd-484e-9f64-b298c50e1c49&embed=%7B%22hvm%22%3Atrue%2C%22ust%22%3Atrue%7D&referrer=StreamWebApp&referrerScenario=EmbedDialog.Create&action=embedview",
  1: "https://liveuclac-my.sharepoint.com/personal/ucacgko_ucl_ac_uk/_layouts/15/embed.aspx?UniqueId=d00b47aa-5bae-423d-a149-ec90304e9e6c&embed=%7B%22hvm%22%3Atrue%2C%22ust%22%3Atrue%7D&referrer=StreamWebApp&referrerScenario=EmbedDialog.Create&action=embedview",
  2: "https://liveuclac-my.sharepoint.com/personal/ucacgko_ucl_ac_uk/_layouts/15/embed.aspx?UniqueId=49498873-ebdd-4ef0-ba67-416de6cd1f83&embed=%7B%22hvm%22%3Atrue%2C%22ust%22%3Atrue%7D&referrer=StreamWebApp&referrerScenario=EmbedDialog.Create&action=embedview",
  3: "https://liveuclac-my.sharepoint.com/personal/ucacgko_ucl_ac_uk/_layouts/15/embed.aspx?UniqueId=ab099c98-87ea-4653-b965-a334c0bf11d4&embed=%7B%22hvm%22%3Atrue%2C%22ust%22%3Atrue%7D&referrer=StreamWebApp&referrerScenario=EmbedDialog.Create&action=embedview",
  4: "https://liveuclac-my.sharepoint.com/personal/ucacgko_ucl_ac_uk/_layouts/15/embed.aspx?UniqueId=7e7da4be-8c8d-4153-ae22-03e226af827a&embed=%7B%22hvm%22%3Atrue%2C%22ust%22%3Atrue%7D&referrer=StreamWebApp&referrerScenario=EmbedDialog.Create&action=embedview",
  5: "https://liveuclac-my.sharepoint.com/personal/ucacgko_ucl_ac_uk/_layouts/15/embed.aspx?UniqueId=b3ff6f51-155d-4e3d-9cf3-8a80476e36ee&embed=%7B%22hvm%22%3Atrue%2C%22ust%22%3Atrue%7D&referrer=StreamWebApp&referrerScenario=EmbedDialog.Create&action=embedview",
};

const lessonTitles = [
  {
    titleAr: "مقدمة ميسرة للذكاء الاصطناعي",
    titleEn: "AI Gentle Introduction",
    descriptionAr: "مدخل واضح ومطمئن إلى المفاهيم التي تشكل عالم الذكاء الاصطناعي.",
    descriptionEn: "A clear, welcoming entry point to the ideas shaping modern AI.",
    duration: "18 min",
  },
  {
    titleAr: "أدوات الذكاء الاصطناعي للإنتاجية",
    titleEn: "AI Productivity Tools for Smarter Working",
    descriptionAr: "اكتشف كيف تجعل الأدوات الذكية يومك أكثر تركيزاً وانسياباً.",
    descriptionEn: "Learn how thoughtful AI tools can make your workday more focused.",
    duration: "24 min",
  },
  {
    titleAr: "أدوات الذكاء الاصطناعي لمستندات أذكى",
    titleEn: "AI Productivity Tools for Smarter Documents",
    descriptionAr: "حوّل المستندات الطويلة إلى معرفة عملية قابلة للاستخدام.",
    descriptionEn: "Turn long documents into practical knowledge you can use.",
    duration: "21 min",
  },
  {
    titleAr: "أدوات الذكاء الاصطناعي للوسائط المتعددة",
    titleEn: "AI Productivity Tools for Multi-Media",
    descriptionAr: "اصنع صوراً وصوتاً وفيديوً أكثر حضوراً باستخدام الذكاء الاصطناعي.",
    descriptionEn: "Create more expressive image, audio, and video work with AI.",
    duration: "27 min",
  },
  {
    titleAr: "أدوات الذكاء الاصطناعي للبرمجة بالانسجام",
    titleEn: "AI Productivity Tools for Vibe Programming",
    descriptionAr: "تعلم كيف تتعاون مع الذكاء الاصطناعي لبناء البرمجيات بانسجام.",
    descriptionEn: "Collaborate with AI to build software with more ease and momentum.",
    duration: "31 min",
  },
  {
    titleAr: "أدوات الذكاء الاصطناعي للمهنيين",
    titleEn: "AI Productivity Tools for Professionals",
    descriptionAr: "اجمع أفضل ممارسات الذكاء الاصطناعي في سير عملك المهني.",
    descriptionEn: "Bring practical AI habits into your professional workflow.",
    duration: "26 min",
  },
] as const;

function getConfiguredVideoUrl(index: number): string | null {
  const url = process.env[`ONEDRIVE_VIDEO_${index}_URL`];
  return url && url.trim().length > 0 ? url.trim() : defaultVideoUrls[index] ?? null;
}

export function listLessons(): Lesson[] {
  return ListLessonsResponse.parse(
    lessonTitles.map((lesson, id) => ({
      id,
      ...lesson,
      videoUrl: getConfiguredVideoUrl(id),
      videoProvider: "onedrive" as const,
    })),
  );
}

export async function recordActivity(
  userId: string,
  input: ActivityInput,
): Promise<ActivityLogEntry> {
  const entry: ActivityLogEntry = {
    timestamp: new Date(),
    eventType: input.eventType,
    loginName: input.loginName ?? null,
    userId,
    lessonId: input.lessonId ?? null,
    lessonTitle: input.lessonTitle ?? null,
  };

  await appendFile(activityLogPath, `${JSON.stringify(entry)}\n`, "utf8");
  return entry;
}

export async function listRecentActivity(
  userId: string,
): Promise<ActivityLogEntry[]> {
  try {
    const contents = await readFile(activityLogPath, "utf8");
    return contents
      .split("\n")
      .filter(Boolean)
      .slice(-500)
      .map((line) => JSON.parse(line) as ActivityLogEntry)
      .filter((entry) => entry.userId === userId)
      .reverse()
      .slice(0, 20);
  } catch (error) {
    const fileError = error as NodeJS.ErrnoException;
    if (fileError.code === "ENOENT") return [];
    throw error;
  }
}

export async function createLessonComment(
  lessonId: number,
  userId: string,
  authorName: string,
  input: LessonCommentInput,
): Promise<LessonComment> {
  const comment: LessonComment = {
    id: randomUUID(),
    lessonId,
    userId,
    authorName,
    content: input.content.trim(),
    createdAt: new Date(),
  };

  await appendFile(commentsLogPath, `${JSON.stringify(comment)}\n`, "utf8");
  return comment;
}

export async function listLessonComments(
  lessonId: number,
): Promise<LessonComment[]> {
  try {
    const contents = await readFile(commentsLogPath, "utf8");
    return contents
      .split("\n")
      .filter(Boolean)
      .slice(-1000)
      .map((line) => JSON.parse(line) as LessonComment)
      .filter((comment) => comment.lessonId === lessonId)
      .reverse()
      .slice(0, 100);
  } catch (error) {
    const fileError = error as NodeJS.ErrnoException;
    if (fileError.code === "ENOENT") return [];
    throw error;
  }
}