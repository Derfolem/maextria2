// frontend/src/lib/courseTextParser.ts
import { Course, Module, Lesson } from '../types';
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs

export function parseBulkCourseText(rawText: string, userId: string | number, userName: string): Course[] {
  const blocks: string[] = [];
  let currentBlock: string[] = [];

  for (const line of rawText.split('\n')) {
    if (line.trim() === '===') {
      if (currentBlock.length > 0) {
        blocks.push(currentBlock.join('\n'));
        currentBlock = [];
      }
    } else {
      currentBlock.push(line);
    }
  }
  if (currentBlock.length > 0) {
    blocks.push(currentBlock.join('\n'));
  }

  const courses: Course[] = [];
  for (const block of blocks) {
    const course = parseCourseText(block.trim(), userId, userName);
    if (course) {
      courses.push(course);
    }
  }
  return courses;
}

export function parseCourseText(rawText: string, currentUserId: string | number, currentUserName: string): Course | null {
  const lines = rawText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  if (lines.length === 0) {
    return null;
  }

  let course: Course = {
    id: uuidv4(),
    title: '',
    description: '',
    price: 0,
    teacher_id: currentUserId,
    teacher_name: currentUserName,
    is_published: false, // Default to not published
    created_at: Date.now(),
    updated_at: Date.now(),
    modules: [],
  };

  let currentModule: Module | null = null;
  let currentLesson: Lesson | null = null;
  let currentContentBuffer: string[] = []; // To accumulate description/content

  const flushContentBuffer = (target: any, field: string) => {
    if (currentContentBuffer.length > 0) {
      target[field] = (target[field] || '') + currentContentBuffer.join('\n');
      currentContentBuffer = [];
    }
  };

  for (const line of lines) {
    // Course-level parsing (ignore category; filled manually)
    if (line.startsWith('Título do Curso:')) {
      course.title = line.substring('Título do Curso:'.length).trim();
      continue;
    }
    if (line.startsWith('Descricao do Curso:') || line.startsWith('Descrição do Curso:')) {
      course.description = line.replace(/^Descri[cç][aã]o do Curso:\s*/i, '').trim();
      continue;
    }
    if (line.startsWith('Nível:') || line.startsWith('Nivel:')) {
      course.level = line.replace(/^N[ií]vel:\s*/i, '').trim();
      continue;
    }
    if (line.startsWith('Preço:') || line.startsWith('Preco:')) {
      const priceStr = line.replace(/^Pre[cç]o:\s*/i, '').trim().replace(',', '.');
      course.price = parseFloat(priceStr) || 0;
      continue;
    }
    if (line.startsWith('Categoria:')) {
      continue;
    }

    // Module-level parsing (accept simple text or markdown style)
    if (
      line.startsWith('## Módulo') ||
      line.startsWith('## Módulo:') ||
      line.startsWith('Módulo ') ||
      line.startsWith('Modulo ')
    ) {
      // Flush previous lesson's content or module description
      if (currentLesson) {
        flushContentBuffer(currentLesson, 'content');
      } else if (currentModule) {
        flushContentBuffer(currentModule, 'description');
      }

      currentModule = {
        id: uuidv4(),
        course_id: course.id,
        title: line.replace(/^##?\s*M[oó]dulo\s*:?\s*/i, '').trim(),
        description: '',
        order_index: course.modules!.length,
        lessons: [],
      };
      course.modules!.push(currentModule);
      currentLesson = null; // Reset lesson context
    } else if (
      (line.startsWith('Descrição do Módulo:') || line.startsWith('Descricao do Modulo:')) &&
      currentModule
    ) {
      flushContentBuffer(currentModule, 'description'); // Flush any pending module description
      currentModule.description = line.replace(/^Descri[cç][aã]o do M[oó]dulo:\s*/i, '').trim();
    }
    // Lesson-level parsing
    else if (
      line.startsWith('### Aula') ||
      line.startsWith('### Aula:') ||
      line.startsWith('Aula ')
    ) {
      // Flush previous lesson's content
      if (currentLesson) {
        flushContentBuffer(currentLesson, 'content');
      }

      if (!currentModule) {
        // If a lesson appears before any module, create a default module
        currentModule = {
          id: uuidv4(),
          course_id: course.id,
          title: 'Módulo Padrão',
          description: '',
          order_index: course.modules!.length,
          lessons: [],
        };
        course.modules!.push(currentModule);
      }

      currentLesson = {
        id: uuidv4(),
        module_id: currentModule.id,
        title: line.replace(/^###?\s*Aula\s*:?\s*/i, '').trim(),
        content: '',
        order_index: currentModule.lessons!.length,
      };
      currentModule.lessons!.push(currentLesson);
    } else if (line.startsWith('URL do Vídeo:') && currentLesson) {
      flushContentBuffer(currentLesson, 'content'); // Flush any pending lesson content
      currentLesson.video_url = line.substring('URL do Vídeo:'.length).trim();
    }
    // General content/description accumulation
    else {
      // Only collect module/lesson text. Ignore top-level course fields.
      if (!currentModule) {
        continue;
      } else if (!currentLesson) { // If no lesson yet, add to module description
        currentContentBuffer.push(line);
      } else { // Otherwise, it's lesson content
        currentContentBuffer.push(line);
      }
    }
  }

  // Flush any remaining content in the buffer
  if (currentLesson) {
    flushContentBuffer(currentLesson, 'content');
  } else if (currentModule) {
    flushContentBuffer(currentModule, 'description');
  } else {
    flushContentBuffer(course, 'description');
  }


  // Clean up empty modules/lessons that might have been created
  course.modules = course.modules?.filter(m => m.title || (m.lessons && m.lessons.length > 0));
  course.modules?.forEach(m => {
    m.lessons = m.lessons?.filter(l => l.title || l.content || l.video_url);
  });

  if (!course.modules || course.modules.length === 0) {
    return null; // Require at least one module to consider extraction valid
  }

  return course;
}
