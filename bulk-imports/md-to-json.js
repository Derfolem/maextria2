#!/usr/bin/env node

/**
 * Converte arquivos .md em formato estruturado para JSON
 * Formato esperado no .md:
 *
 * Título do Curso: ...
 * Descrição do Curso: ...
 * Categoria: ...
 * Nível: ...
 * Preço: ...
 *
 * ## Módulo 1: ...
 * Descrição do Módulo: ...
 *
 * ### Aula 1: ...
 * Conteúdo da Aula: ...
 */

const fs = require('fs');
const path = require('path');

const COURSES_DIR = path.join(__dirname, 'courses');

console.log('🔄 Convertendo arquivos .md para .json...\n');

// Verificar se a pasta courses existe
if (!fs.existsSync(COURSES_DIR)) {
  console.error('❌ Erro: Pasta "courses" não encontrada!');
  process.exit(1);
}

// Ler todos os arquivos .md da pasta courses
const files = fs.readdirSync(COURSES_DIR).filter(file => file.endsWith('.md'));

if (files.length === 0) {
  console.error('❌ Nenhum arquivo .md encontrado na pasta "courses"!');
  console.log('💡 Adicione arquivos .md na pasta courses/');
  process.exit(1);
}

console.log(`📁 Encontrados ${files.length} arquivo(s) .md:\n`);

let converted = 0;
let errors = 0;

// Função para mapear nível
function mapLevel(nivel) {
  const normalized = nivel.toLowerCase().trim();
  if (normalized.includes('inicia') || normalized === 'básico' || normalized === 'basico') {
    return 'beginner';
  }
  if (normalized.includes('inter') || normalized === 'médio' || normalized === 'medio') {
    return 'intermediate';
  }
  if (normalized.includes('avan') || normalized === 'avançado' || normalized === 'avancado') {
    return 'advanced';
  }
  return 'beginner'; // default
}

// Função para calcular duração estimada
function estimateDuration(modules) {
  let totalMinutes = 0;
  modules.forEach(mod => {
    mod.lessons.forEach(lesson => {
      totalMinutes += lesson.duration_minutes || 0;
    });
  });
  return Math.ceil(totalMinutes / 60);
}

// Função para converter markdown para HTML básico
function mdToHtml(text) {
  if (!text) return '';

  let html = text;

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Bold e Italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Listas
  const lines = html.split('\n');
  let inList = false;
  let result = [];

  lines.forEach(line => {
    if (line.trim().match(/^[-*]\s+/)) {
      if (!inList) {
        result.push('<ul>');
        inList = true;
      }
      result.push('<li>' + line.trim().replace(/^[-*]\s+/, '') + '</li>');
    } else {
      if (inList) {
        result.push('</ul>');
        inList = false;
      }
      if (line.trim()) {
        // Apenas adiciona <p> se não for tag HTML
        if (!line.trim().match(/^<[^>]+>/)) {
          result.push('<p>' + line.trim() + '</p>');
        } else {
          result.push(line);
        }
      }
    }
  });

  if (inList) result.push('</ul>');

  return result.join('\n');
}

// Processar cada arquivo
files.forEach((file, index) => {
  const filePath = path.join(COURSES_DIR, file);
  console.log(`   ${index + 1}. ${file}`);

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    // Extrair metadados do topo
    const metadata = {};
    const modules = [];
    let currentModule = null;
    let currentLesson = null;
    let contentBuffer = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Metadados (no início do arquivo)
      if (trimmed.match(/^Título do Curso:/i)) {
        metadata.title = trimmed.replace(/^Título do Curso:/i, '').trim();
      } else if (trimmed.match(/^Descrição do Curso:/i)) {
        metadata.description = trimmed.replace(/^Descrição do Curso:/i, '').trim();
      } else if (trimmed.match(/^Categoria:/i)) {
        metadata.category = trimmed.replace(/^Categoria:/i, '').trim();
      } else if (trimmed.match(/^Nível:/i)) {
        metadata.level = trimmed.replace(/^Nível:/i, '').trim();
      } else if (trimmed.match(/^Preço:/i)) {
        const priceStr = trimmed.replace(/^Preço:/i, '').trim().replace(',', '.');
        metadata.price = parseFloat(priceStr) || 0;
      }
      // Módulo (## Módulo X: ...)
      else if (trimmed.match(/^##\s+Módulo\s+\d+:/i)) {
        // Salvar aula anterior se houver
        if (currentLesson && currentModule) {
          currentLesson.content = mdToHtml(contentBuffer.join('\n').trim());
          currentModule.lessons.push(currentLesson);
          currentLesson = null;
          contentBuffer = [];
        }

        // Salvar módulo anterior se houver
        if (currentModule) {
          modules.push(currentModule);
        }

        // Novo módulo
        const moduleTitle = trimmed.replace(/^##\s+/, '').trim();
        currentModule = {
          title: moduleTitle,
          description: '',
          lessons: []
        };
      }
      // Descrição do Módulo
      else if (trimmed.match(/^Descrição do Módulo:/i) && currentModule) {
        currentModule.description = trimmed.replace(/^Descrição do Módulo:/i, '').trim();
      }
      // Aula (### Aula X: ...)
      else if (trimmed.match(/^###\s+Aula\s+\d+:/i)) {
        // Salvar aula anterior se houver
        if (currentLesson && currentModule) {
          currentLesson.content = mdToHtml(contentBuffer.join('\n').trim());
          currentModule.lessons.push(currentLesson);
          contentBuffer = [];
        }

        // Nova aula
        const lessonTitle = trimmed.replace(/^###\s+/, '').trim();
        currentLesson = {
          title: lessonTitle,
          content: '',
          duration_minutes: 15 // default
        };
      }
      // Conteúdo da Aula
      else if (trimmed.match(/^Conteúdo da Aula:/i)) {
        const initialContent = trimmed.replace(/^Conteúdo da Aula:/i, '').trim();
        if (initialContent) {
          contentBuffer.push(initialContent);
        }
      }
      // Adicionar ao buffer de conteúdo
      else if (currentLesson && trimmed) {
        contentBuffer.push(line);
      }
    }

    // Salvar última aula e módulo
    if (currentLesson && currentModule) {
      currentLesson.content = mdToHtml(contentBuffer.join('\n').trim());
      currentModule.lessons.push(currentLesson);
    }
    if (currentModule) {
      modules.push(currentModule);
    }

    // Validação
    if (!metadata.title) {
      console.log('      ❌ Erro: Título do Curso não encontrado');
      errors++;
      return;
    }

    if (modules.length === 0) {
      console.log('      ❌ Erro: Nenhum módulo encontrado');
      errors++;
      return;
    }

    // Estimar duração total
    const estimatedHours = estimateDuration(modules) || 20;

    // Criar objeto JSON
    const courseJson = {
      title: metadata.title,
      description: metadata.description || 'Curso completo e prático.',
      category_id: null, // TODO: mapear categorias
      difficulty: mapLevel(metadata.level || 'iniciante'),
      duration_hours: estimatedHours,
      certificate_price: metadata.price || 49.90,
      modules: modules
    };

    // Salvar JSON
    const jsonFileName = file.replace(/\.md$/i, '.json');
    const jsonFilePath = path.join(COURSES_DIR, jsonFileName);
    fs.writeFileSync(jsonFilePath, JSON.stringify(courseJson, null, 2), 'utf8');

    const totalLessons = modules.reduce((sum, mod) => sum + mod.lessons.length, 0);
    console.log(`      ✅ Convertido: ${modules.length} módulos, ${totalLessons} aulas`);
    converted++;

  } catch (error) {
    console.log(`      ❌ Erro: ${error.message}`);
    errors++;
  }
});

console.log('\n─────────────────────────────────────────\n');
console.log(`✅ Arquivos convertidos: ${converted}`);
console.log(`❌ Erros encontrados: ${errors}`);

if (converted > 0) {
  console.log('\n💡 Próximos passos:');
  console.log('   1. node combine.js');
  console.log('   2. ./import.sh\n');
}

if (errors > 0) {
  process.exit(1);
}
