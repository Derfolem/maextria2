import { useEffect, useMemo, useRef, useState } from 'react';

type Props = {
  value: string;
  onChange: (value: string) => void;
  onBlur?: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
  className?: string;
};

const FONT_FAMILIES = [
  'Arial',
  'Georgia',
  'Times New Roman',
  'Courier New',
  'Verdana',
  'Trebuchet MS',
];

const FONT_SIZES = [
  { label: 'Pequena', value: '1' },
  { label: 'Normal', value: '3' },
  { label: 'Média', value: '4' },
  { label: 'Grande', value: '5' },
  { label: 'Gigante', value: '6' },
];

export default function RichTextEditor({
  value,
  onChange,
  onBlur,
  placeholder,
  minHeight = 160,
  className,
}: Props) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [fontFamily, setFontFamily] = useState(FONT_FAMILIES[0]);
  const [fontSize, setFontSize] = useState(FONT_SIZES[1].value);

  const isEmpty = useMemo(() => {
    const normalized = (value || '').replace(/<br\s*\/?>(\s*)/g, '').replace(/&nbsp;/g, '').trim();
    return normalized.length === 0;
  }, [value]);

  useEffect(() => {
    if (!editorRef.current || isFocused) return;
    if (editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value, isFocused]);

  const syncValue = () => {
    if (!editorRef.current) return;
    onChange(editorRef.current.innerHTML);
  };

  const exec = (command: string, commandValue?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    syncValue();
  };

  const insertImage = () => {
    const url = prompt('Cole a URL da imagem');
    if (!url) return;
    exec('insertImage', url);
  };

  const insertTable = () => {
    const rows = Number(prompt('Quantas linhas? (ex: 3)', '3'));
    const cols = Number(prompt('Quantas colunas? (ex: 3)', '3'));
    if (!rows || !cols) return;
    const table = `<table style=\"width:100%; border-collapse: collapse;\" border=\"1\">${Array.from({ length: rows })
      .map(
        () =>
          `<tr>${Array.from({ length: cols }).map(() => '<td style=\"padding:6px;\">&nbsp;</td>').join('')}</tr>`
      )
      .join('')}</table><p><br></p>`;
    exec('insertHTML', table);
  };

  const handleMouseDown = (event: React.MouseEvent) => {
    event.preventDefault();
  };

  return (
    <div className={`rounded-[14px] border border-[hsl(var(--border))] bg-[hsl(var(--card))] ${className || ''}`}>
      <div className="flex flex-wrap gap-2 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-2">
        <select
          value={fontFamily}
          onChange={(event) => {
            setFontFamily(event.target.value);
            exec('fontName', event.target.value);
          }}
          className="input-field text-xs max-w-[160px]"
        >
          {FONT_FAMILIES.map((font) => (
            <option key={font} value={font}>
              {font}
            </option>
          ))}
        </select>
        <select
          value={fontSize}
          onChange={(event) => {
            setFontSize(event.target.value);
            exec('fontSize', event.target.value);
          }}
          className="input-field text-xs max-w-[140px]"
        >
          {FONT_SIZES.map((size) => (
            <option key={size.value} value={size.value}>
              {size.label}
            </option>
          ))}
        </select>
        <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('bold')} className="btn-outline text-xs">B</button>
        <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('italic')} className="btn-outline text-xs">I</button>
        <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('underline')} className="btn-outline text-xs">U</button>
        <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('strikeThrough')} className="btn-outline text-xs">S</button>
        <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('subscript')} className="btn-outline text-xs">X₂</button>
        <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('superscript')} className="btn-outline text-xs">X²</button>
        <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('insertOrderedList')} className="btn-outline text-xs">1.</button>
        <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('insertUnorderedList')} className="btn-outline text-xs">•</button>
        <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('indent')} className="btn-outline text-xs">→</button>
        <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('outdent')} className="btn-outline text-xs">←</button>
        <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('justifyLeft')} className="btn-outline text-xs">L</button>
        <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('justifyCenter')} className="btn-outline text-xs">C</button>
        <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('justifyRight')} className="btn-outline text-xs">R</button>
        <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('justifyFull')} className="btn-outline text-xs">J</button>
        <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('formatBlock', '<h1>')} className="btn-outline text-xs">H1</button>
        <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('formatBlock', '<h2>')} className="btn-outline text-xs">H2</button>
        <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('formatBlock', '<h3>')} className="btn-outline text-xs">H3</button>
        <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('formatBlock', '<p>')} className="btn-outline text-xs">P</button>
        <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('formatBlock', '<blockquote>')} className="btn-outline text-xs">❝</button>
        <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('formatBlock', '<pre>')} className="btn-outline text-xs">{`</>`}</button>
        <input
          type="color"
          onChange={(event) => exec('foreColor', event.target.value)}
          className="h-8 w-10 border border-[hsl(var(--border))] rounded"
          title="Cor do texto"
        />
        <input
          type="color"
          onChange={(event) => exec('hiliteColor', event.target.value)}
          className="h-8 w-10 border border-[hsl(var(--border))] rounded"
          title="Cor de fundo"
        />
        <button type="button" onMouseDown={handleMouseDown} onClick={insertImage} className="btn-outline text-xs">Imagem</button>
        <button type="button" onMouseDown={handleMouseDown} onClick={insertTable} className="btn-outline text-xs">Tabela</button>
        <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('insertHorizontalRule')} className="btn-outline text-xs">Linha</button>
        <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('removeFormat')} className="btn-outline text-xs">Limpar</button>
        <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('undo')} className="btn-outline text-xs">↶</button>
        <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('redo')} className="btn-outline text-xs">↷</button>
      </div>

      <div className="relative">
        {isEmpty && (
          <div className="pointer-events-none absolute inset-0 p-4 text-sm text-[hsl(var(--muted-foreground))]">
            {placeholder}
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable
          className="min-h-[140px] p-4 text-[hsl(var(--foreground))] outline-none"
          style={{ minHeight }}
          onInput={syncValue}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            syncValue();
            onBlur?.(editorRef.current?.innerHTML || '');
          }}
          suppressContentEditableWarning
        />
      </div>
    </div>
  );
}
