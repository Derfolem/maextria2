#!/usr/bin/env node

/**
 * Script para combinar múltiplos JSONs de cursos em um único arquivo
 * para importação em massa
 */

const fs = require('fs');
const path = require('path');

const COURSES_DIR = path.join(__dirname, 'courses');
const OUTPUT_FILE = path.join(__dirname, 'combined.json');

console.log('🔄 Combinando cursos...\n');

// Verificar se a pasta courses existe
if (!fs.existsSync(COURSES_DIR)) {
  console.error('❌ Erro: Pasta "courses" não encontrada!');
  console.log('💡 Crie a pasta e adicione seus arquivos JSON nela.');
  process.exit(1);
}

// Ler todos os arquivos JSON da pasta courses
const files = fs.readdirSync(COURSES_DIR).filter(file => file.endsWith('.json'));

if (files.length === 0) {
  console.error('❌ Erro: Nenhum arquivo JSON encontrado na pasta "courses"!');
  console.log('💡 Adicione pelo menos um arquivo .json na pasta courses/');
  process.exit(1);
}

console.log(`📁 Encontrados ${files.length} arquivo(s):\n`);

const courses = [];
const errors = [];

// Processar cada arquivo
files.forEach((file, index) => {
  const filePath = path.join(COURSES_DIR, file);
  console.log(`   ${index + 1}. ${file}`);

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);

    // Verificar se o JSON já tem a estrutura com "courses"
    if (data.courses && Array.isArray(data.courses)) {
      courses.push(...data.courses);
      console.log(`      ✅ ${data.courses.length} curso(s) adicionado(s)`);
    } else if (data.title) {
      // É um curso único sem wrapper
      courses.push(data);
      console.log(`      ✅ 1 curso adicionado`);
    } else {
      errors.push(`${file}: Formato inválido (sem "courses" ou "title")`);
      console.log(`      ❌ Formato inválido`);
    }
  } catch (error) {
    errors.push(`${file}: ${error.message}`);
    console.log(`      ❌ Erro ao processar: ${error.message}`);
  }
});

console.log('\n─────────────────────────────────────────\n');

// Verificar erros
if (errors.length > 0) {
  console.error('⚠️  Avisos/Erros encontrados:\n');
  errors.forEach(err => console.error(`   • ${err}`));
  console.log();
}

// Verificar se há cursos válidos
if (courses.length === 0) {
  console.error('❌ Nenhum curso válido encontrado!');
  process.exit(1);
}

// Verificar limite
if (courses.length > 50) {
  console.error(`❌ Erro: ${courses.length} cursos encontrados, mas o limite é 50!`);
  console.log('💡 Remova alguns arquivos da pasta "courses" ou divida em múltiplas importações.');
  process.exit(1);
}

// Validação básica
console.log('🔍 Validando cursos...\n');
let validationErrors = 0;

courses.forEach((course, idx) => {
  if (!course.title) {
    console.error(`   ❌ Curso ${idx + 1}: sem título`);
    validationErrors++;
  }
  if (!course.modules || course.modules.length === 0) {
    console.error(`   ❌ Curso "${course.title || idx + 1}": sem módulos`);
    validationErrors++;
  }
});

if (validationErrors > 0) {
  console.log(`\n❌ ${validationErrors} erro(s) de validação encontrado(s)!`);
  console.log('💡 Corrija os erros antes de continuar.');
  process.exit(1);
}

console.log('   ✅ Todos os cursos são válidos!\n');

// Criar objeto final
const output = {
  courses: courses
};

// Salvar arquivo combinado
try {
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf8');
  console.log('─────────────────────────────────────────\n');
  console.log('✅ Sucesso!\n');
  console.log(`📄 Arquivo gerado: combined.json`);
  console.log(`📊 Total de cursos: ${courses.length}`);
  console.log(`📦 Total de módulos: ${courses.reduce((sum, c) => sum + (c.modules?.length || 0), 0)}`);
  console.log(`📚 Total de aulas: ${courses.reduce((sum, c) =>
    sum + (c.modules?.reduce((mSum, m) => mSum + (m.lessons?.length || 0), 0) || 0), 0)}`);
  console.log('\n💡 Próximo passo: importar o arquivo combined.json via API\n');
} catch (error) {
  console.error(`❌ Erro ao salvar arquivo: ${error.message}`);
  process.exit(1);
}
