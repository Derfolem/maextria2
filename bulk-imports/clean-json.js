#!/usr/bin/env node

/**
 * Script para limpar arquivos JSON que vêm com markdown do ChatGPT
 * Remove ```json e ``` do início e fim dos arquivos
 */

const fs = require('fs');
const path = require('path');

const COURSES_DIR = path.join(__dirname, 'courses');

console.log('🧹 Limpando arquivos JSON...\n');

// Verificar se a pasta courses existe
if (!fs.existsSync(COURSES_DIR)) {
  console.error('❌ Erro: Pasta "courses" não encontrada!');
  process.exit(1);
}

// Ler todos os arquivos JSON da pasta courses
const files = fs.readdirSync(COURSES_DIR)
  .filter(file => file.endsWith('.json'))
  .filter(file => !file.startsWith('exemplo-')); // Não mexer nos exemplos

if (files.length === 0) {
  console.error('❌ Nenhum arquivo JSON encontrado!');
  process.exit(1);
}

console.log(`📁 Encontrados ${files.length} arquivo(s) para limpar:\n`);

let cleaned = 0;
let alreadyClean = 0;
let errors = 0;

files.forEach((file, index) => {
  const filePath = path.join(COURSES_DIR, file);
  console.log(`   ${index + 1}. ${file}`);

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;

    // Remover ```json do início
    content = content.replace(/^```json\s*/i, '');

    // Remover ``` do final
    content = content.replace(/\s*```\s*$/, '');

    // Remover espaços em branco extras
    content = content.trim();

    // Verificar se mudou
    if (content !== original) {
      // Validar JSON antes de salvar
      try {
        JSON.parse(content);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('      ✅ Limpou e validou');
        cleaned++;
      } catch (jsonError) {
        console.log(`      ❌ JSON inválido após limpeza: ${jsonError.message}`);
        errors++;
      }
    } else {
      // Tentar validar mesmo sem mudanças
      try {
        JSON.parse(content);
        console.log('      ✅ Já estava limpo');
        alreadyClean++;
      } catch (jsonError) {
        console.log(`      ❌ JSON inválido: ${jsonError.message}`);
        errors++;
      }
    }
  } catch (error) {
    console.log(`      ❌ Erro: ${error.message}`);
    errors++;
  }
});

console.log('\n─────────────────────────────────────────\n');
console.log(`🧹 Arquivos limpos: ${cleaned}`);
console.log(`✅ Já estavam limpos: ${alreadyClean}`);
console.log(`❌ Erros encontrados: ${errors}`);

if (errors > 0) {
  console.log('\n⚠️  Alguns arquivos ainda têm problemas. Revise-os manualmente.');
  process.exit(1);
}

console.log('\n✅ Todos os arquivos estão prontos para uso!\n');
console.log('💡 Próximo passo: node combine.js\n');
