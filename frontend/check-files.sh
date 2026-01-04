#!/bin/bash

echo "========================================="
echo "Verificando Arquivos do Frontend MAEXTRIA"
echo "========================================="
echo ""

files=(
  "src/main.tsx"
  "src/App.tsx"
  "src/index.css"
  "src/lib/api.ts"
  "src/lib/store.ts"
  "src/types/index.ts"
  "src/components/Layout.tsx"
  "src/components/AIChat.tsx"
  "src/pages/Home.tsx"
  "src/pages/Login.tsx"
  "src/pages/Register.tsx"
  "src/pages/Courses.tsx"
  "src/pages/CourseDetail.tsx"
  "src/pages/Settings.tsx"
  "src/pages/student/Dashboard.tsx"
  "src/pages/student/MyCourses.tsx"
  "src/pages/student/CoursePlayer.tsx"
  "src/pages/teacher/Dashboard.tsx"
  "src/pages/teacher/MyCourses.tsx"
  "src/pages/teacher/CourseEditor.tsx"
  "src/pages/admin/Dashboard.tsx"
  "src/pages/admin/Users.tsx"
  "src/pages/admin/Courses.tsx"
  "src/pages/admin/Settings.tsx"
)

missing_files=0
found_files=0

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "✅ $file"
    ((found_files++))
  else
    echo "❌ $file - FALTANDO"
    ((missing_files++))
  fi
done

echo ""
echo "========================================="
echo "Resumo:"
echo "  Arquivos encontrados: $found_files"
echo "  Arquivos faltando: $missing_files"
echo "  Total: ${#files[@]}"
echo "========================================="

if [ $missing_files -eq 0 ]; then
  echo "✅ Todos os arquivos foram criados com sucesso!"
  exit 0
else
  echo "⚠️  Alguns arquivos estão faltando!"
  exit 1
fi
