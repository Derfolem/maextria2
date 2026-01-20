// frontend/src/lib/courseTextParser.ts
import { Course, Module, Lesson } from '../types';
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs

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
    // Course-level parsing
    if (line.startsWith('Título do Curso:')) {
      flushContentBuffer(course, 'description'); // Flush any pending course description
      course.title = line.substring('Título do Curso:'.length).trim();
    } else if (line.startsWith('Descrição do Curso:')) {
      flushContentBuffer(course, 'description'); // Flush any pending course description
      course.description = line.substring('Descrição do Curso:'.length).trim();
    } else if (line.startsWith('Categoria:')) {
      flushContentBuffer(course, 'description'); // Flush any pending course description
      course.category = line.substring('Categoria:'.length).trim();
    } else if (line.startsWith('Nível:')) {
      flushContentBuffer(course, 'description'); // Flush any pending course description
      course.level = line.substring('Nível:'.length).trim();
    } else if (line.startsWith('Preço:')) {
      flushContentBuffer(course, 'description'); // Flush any pending course description
      const priceStr = line.substring('Preço:'.length).trim().replace(',', '.');
      course.price = parseFloat(priceStr) || 0;
    }
    // Module-level parsing
    else if (line.startsWith('## Módulo:')) {
      // Flush previous lesson's content or module description
      if (currentLesson) {
        flushContentBuffer(currentLesson, 'content');
      } else if (currentModule) {
        flushContentBuffer(currentModule, 'description');
      }

      currentModule = {
        id: uuidv4(),
        course_id: course.id,
        title: line.substring('## Módulo:'.length).trim(),
        description: '',
        order_index: course.modules!.length,
        lessons: [],
      };
      course.modules!.push(currentModule);
      currentLesson = null; // Reset lesson context
    } else if (line.startsWith('Descrição do Módulo:') && currentModule) {
      flushContentBuffer(currentModule, 'description'); // Flush any pending module description
      currentModule.description = line.substring('Descrição do Módulo:'.length).trim();
    }
    // Lesson-level parsing
    else if (line.startsWith('### Aula:')) {
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
        title: line.substring('### Aula:'.length).trim(),
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
      // If no specific tag, it's either course description, module description, or lesson content
      if (!course.title) { // If course title not yet found, assume it's part of course description
        currentContentBuffer.push(line);
      } else if (!currentModule) { // If no module yet, add to course description
        currentContentBuffer.push(line);
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
  course.modules = course.modules?.filter(m => m.title || m.lessons?.length > 0);
  course.modules?.forEach(m => {
    m.lessons = m.lessons?.filter(l => l.title || l.content || l.video_url);
  });

  if (!course.title) {
    return null; // A course must have a title
  }

  return course;
}