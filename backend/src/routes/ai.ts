import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { generateCourseImage, generateCourseDescription, generateLessonContent, chatWithAI } from '../utils/openai';

const router = Router();

// Generate course cover image
router.post('/generate-image', authenticate, authorize('teacher', 'admin'), async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    const imageUrl = await generateCourseImage(prompt);

    res.json({ imageUrl });
  } catch (error: any) {
    console.error('Generate image error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate image' });
  }
});

// Generate course description
router.post('/generate-description', authenticate, authorize('teacher', 'admin'), async (req: Request, res: Response) => {
  try {
    const { title, category, difficulty } = req.body;

    if (!title || !category || !difficulty) {
      res.status(400).json({ error: 'Title, category, and difficulty are required' });
      return;
    }

    const description = await generateCourseDescription(title, category, difficulty);

    res.json({ description });
  } catch (error: any) {
    console.error('Generate description error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate description' });
  }
});

// Generate lesson content
router.post('/generate-lesson', authenticate, authorize('teacher', 'admin'), async (req: Request, res: Response) => {
  try {
    const { lessonTitle, courseContext } = req.body;

    if (!lessonTitle || !courseContext) {
      res.status(400).json({ error: 'Lesson title and course context are required' });
      return;
    }

    const content = await generateLessonContent(lessonTitle, courseContext);

    res.json({ content });
  } catch (error: any) {
    console.error('Generate lesson content error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate lesson content' });
  }
});

// Chat with AI assistant
router.post('/chat', authenticate, async (req: Request, res: Response) => {
  try {
    const { message, conversationHistory } = req.body;

    if (!message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    // Validação de tamanho para prevenir abuso
    if (message.length > 5000) {
      res.status(400).json({ error: 'Message is too long (max 5000 characters)' });
      return;
    }

    if (conversationHistory && conversationHistory.length > 50) {
      res.status(400).json({ error: 'Conversation history is too long (max 50 messages)' });
      return;
    }

    const response = await chatWithAI(message, conversationHistory || []);

    res.json({ response });
  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message || 'Failed to process chat message' });
  }
});

export default router;
