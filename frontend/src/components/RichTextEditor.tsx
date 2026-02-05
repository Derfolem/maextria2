import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FiBold,
  FiItalic,
  FiUnderline,
  FiSlash,
  FiList,
  FiList as FiListBulleted,
  FiAlignLeft,
  FiAlignCenter,
  FiAlignRight,
  FiAlignJustify,
  FiType,
  FiDroplet,
  FiImage,
  FiGrid,
  FiHash,
  FiCode,
  FiCornerDownRight,
  FiDelete,
  FiRotateCcw,
  FiRotateCw,
  FiMinus,
  FiChevronDown,
  FiMoreHorizontal,
  FiMessageSquare,
} from 'react-icons/fi';


type Props = {
  value: string;
  onChange: (value: string) => void;
  onBlur?: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
  className?: string;
};

const FONT_FAMILIES = ['Inter', 'Georgia', 'Times New Roman', 'Courier New', 'Verdana'];
const FONT_SIZES = [
  { label: 'Pequena', value: '2' },
  { label: 'Normal', value: '3' },
  { label: 'Media', value: '4' },
  { label: 'Grande', value: '5' },
  { label: 'Gigante', value: '6' },
];

const isMobile = () => typeof window !== 'undefined' && window.innerWidth < 640;

export default function RichTextEditor({
  value,
  onChange,
  onBlur,
  placeholder,
  minHeight = 160,
  className,
}: Props) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const bubbleRef = useRef<HTMLDivElement | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [fontFamily, setFontFamily] = useState(FONT_FAMILIES[0]);
  const [fontSize, setFontSize] = useState(FONT_SIZES[1].value);
  const [moreOpen, setMoreOpen] = useState(false);
  const [bubbleVisible, setBubbleVisible] = useState(false);
  const [bubbleStyle, setBubbleStyle] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

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

  useEffect(() => {
    const handleSelection = () => {
      if (!isMobile() || !editorRef.current) {
        setBubbleVisible(false);
        return;
      }
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        setBubbleVisible(false);
        return;
      }
      if (!editorRef.current.contains(selection.anchorNode)) {
        setBubbleVisible(false);
        return;
      }
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (!rect || rect.width === 0) {
        setBubbleVisible(false);
        return;
      }
      const top = window.scrollY + rect.top - 48;
      const left = window.scrollX + rect.left + rect.width / 2;
      setBubbleStyle({ top, left });
      setBubbleVisible(true);
    };

    document.addEventListener('selectionchange', handleSelection);
    window.addEventListener('resize', handleSelection);
    return () => {
      document.removeEventListener('selectionchange', handleSelection);
      window.removeEventListener('resize', handleSelection);
    };
  }, []);

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
    const table = `<table style="width:100%; border-collapse: collapse;" border="1">${Array.from({ length: rows })
      .map(() => `<tr>${Array.from({ length: cols }).map(() => '<td style=\"padding:6px;\">&nbsp;</td>').join('')}</tr>`)
      .join('')}</table><p><br></p>`;
    exec('insertHTML', table);
  };

  const handleMouseDown = (event: React.MouseEvent) => {
    event.preventDefault();
  };

  const isActive = (command: string) => {
    try {
      return document.queryCommandState(command);
    } catch {
      return false;
    }
  };

  const activeBlock = () => {
    try {
      return (document.queryCommandValue('formatBlock') || '').toLowerCase();
    } catch {
      return '';
    }
  };

  const buttonClass = (active?: boolean) =>
    `inline-flex items-center justify-center rounded-[10px] px-2.5 py-2 text-xs transition ${
      active
        ? 'bg-[rgba(64,173,190,0.18)] text-[hsl(var(--foreground))] shadow-[0_0_10px_rgba(64,173,190,0.25)]'
        : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[rgba(64,173,190,0.12)]'
    }`;

  const groupClass = 'flex items-center gap-1.5 px-2';
  const dividerClass = 'mx-2 h-7 w-px bg-[hsl(var(--border))]/60';

  return (
    <div className={`rounded-[16px] border border-[hsl(var(--border))] bg-[hsl(var(--card))] ${className || ''}`}>
      <div className="border-b border-[hsl(var(--border))]/70 bg-[hsl(var(--graphite))] px-3 py-2">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <div className={groupClass}>
            <FiType className="text-[hsl(var(--muted-foreground))]" />
            <select
              value={fontFamily}
              onChange={(event) => {
                setFontFamily(event.target.value);
                exec('fontName', event.target.value);
              }}
              className="bg-transparent text-xs text-[hsl(var(--foreground))] border border-[hsl(var(--border))]/60 rounded-lg px-2 py-1"
            >
              {FONT_FAMILIES.map((font) => (
                <option key={font} value={font}>
                  {font}
                </option>
              ))}
            </select>
            <div className="relative">
              <select
                value={fontSize}
                onChange={(event) => {
                  setFontSize(event.target.value);
                  exec('fontSize', event.target.value);
                }}
                className="bg-transparent text-xs text-[hsl(var(--foreground))] border border-[hsl(var(--border))]/60 rounded-lg px-2 py-1 pr-6"
              >
                {FONT_SIZES.map((size) => (
                  <option key={size.value} value={size.value}>
                    {size.label}
                  </option>
                ))}
              </select>
              <FiChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
            </div>
          </div>

          <div className={dividerClass} />

          <div className={groupClass}>
            <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('bold')} className={buttonClass(isActive('bold'))}>
              <FiBold />
            </button>
            <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('italic')} className={buttonClass(isActive('italic'))}>
              <FiItalic />
            </button>
            <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('underline')} className={buttonClass(isActive('underline'))}>
              <FiUnderline />
            </button>
            <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('strikeThrough')} className={buttonClass(isActive('strikeThrough'))}>
              <FiSlash />
            </button>
            <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('formatBlock', '<h1>')} className={buttonClass(activeBlock() === 'h1')}>
              H1
            </button>
            <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('formatBlock', '<h2>')} className={buttonClass(activeBlock() === 'h2')}>
              H2
            </button>
            <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('formatBlock', '<h3>')} className={buttonClass(activeBlock() === 'h3')}>
              H3
            </button>
            <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('formatBlock', '<p>')} className={buttonClass(activeBlock() === 'p')}>
              P
            </button>
          </div>

          <div className={dividerClass} />

          <div className={groupClass}>
            <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('insertUnorderedList')} className={buttonClass(isActive('insertUnorderedList'))}>
              <FiListBulleted />
            </button>
            <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('insertOrderedList')} className={buttonClass(isActive('insertOrderedList'))}>
              <FiList />
            </button>
            <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('justifyLeft')} className={buttonClass(isActive('justifyLeft'))}>
              <FiAlignLeft />
            </button>
            <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('justifyCenter')} className={buttonClass(isActive('justifyCenter'))}>
              <FiAlignCenter />
            </button>
            <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('justifyRight')} className={buttonClass(isActive('justifyRight'))}>
              <FiAlignRight />
            </button>
            <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('justifyFull')} className={buttonClass(isActive('justifyFull'))}>
              <FiAlignJustify />
            </button>
          </div>

          <div className={dividerClass} />

          <div className={`${groupClass} hidden lg:flex`}>
            <input
              type="color"
              onChange={(event) => exec('foreColor', event.target.value)}
              className="h-8 w-9 rounded-lg border border-[hsl(var(--border))]/60 bg-transparent"
              title="Cor do texto"
            />
            <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('hiliteColor', '#2dd4bf')} className={buttonClass()}>
              <FiDroplet />
            </button>
            <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('formatBlock', '<blockquote>')} className={buttonClass(activeBlock() === 'blockquote')}>
              <FiMessageSquare />
            </button>
            <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('formatBlock', '<pre>')} className={buttonClass(activeBlock() === 'pre')}>
              <FiCode />
            </button>
          </div>

          <div className={dividerClass} />

          <div className={`${groupClass} hidden lg:flex`}>
            <button type="button" onMouseDown={handleMouseDown} onClick={insertImage} className={buttonClass()}>
              <FiImage />
            </button>
            <button type="button" onMouseDown={handleMouseDown} onClick={insertTable} className={buttonClass()}>
              <FiGrid />
            </button>
            <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('insertHorizontalRule')} className={buttonClass()}>
              <FiMinus />
            </button>
          </div>

          <div className={dividerClass} />

          <div className={groupClass}>
            <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('removeFormat')} className={buttonClass()}>
              <FiDelete />
            </button>
            <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('undo')} className={buttonClass()}>
              <FiRotateCcw />
            </button>
            <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('redo')} className={buttonClass()}>
              <FiRotateCw />
            </button>
          </div>

          <div className="ml-auto flex items-center gap-2 lg:hidden">
            <button
              type="button"
              onMouseDown={handleMouseDown}
              onClick={() => setMoreOpen((prev) => !prev)}
              className={buttonClass(moreOpen)}
            >
              <FiMoreHorizontal />
            </button>
          </div>
        </div>

        {moreOpen && (
          <div className="mt-3 flex flex-wrap gap-2 border-t border-[hsl(var(--border))]/70 pt-3 lg:hidden">
            <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('subscript')} className={buttonClass(isActive('subscript'))}>
              Sub
            </button>
            <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('superscript')} className={buttonClass(isActive('superscript'))}>
              Sup
            </button>
            <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('indent')} className={buttonClass()}>
              <FiCornerDownRight />
            </button>
            <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('outdent')} className={buttonClass()}>
              <FiCornerDownRight className="-scale-x-100" />
            </button>
            <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('formatBlock', '<h3>')} className={buttonClass(activeBlock() === 'h3')}>
              <FiHash />
            </button>
            <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('formatBlock', '<blockquote>')} className={buttonClass(activeBlock() === 'blockquote')}>
              <FiMessageSquare />
            </button>
            <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('formatBlock', '<pre>')} className={buttonClass(activeBlock() === 'pre')}>
              <FiCode />
            </button>
            <input
              type="color"
              onChange={(event) => exec('foreColor', event.target.value)}
              className="h-8 w-9 rounded-lg border border-[hsl(var(--border))]/60 bg-transparent"
              title="Cor do texto"
            />
            <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('hiliteColor', '#2dd4bf')} className={buttonClass()}>
              <FiDroplet />
            </button>
            <button type="button" onMouseDown={handleMouseDown} onClick={insertImage} className={buttonClass()}>
              <FiImage />
            </button>
            <button type="button" onMouseDown={handleMouseDown} onClick={insertTable} className={buttonClass()}>
              <FiGrid />
            </button>
            <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('insertHorizontalRule')} className={buttonClass()}>
              <FiMinus />
            </button>
          </div>
        )}
      </div>

      {bubbleVisible && (
        <div
          ref={bubbleRef}
          className="fixed z-50 -translate-x-1/2 rounded-full border border-[hsl(var(--border))]/70 bg-[rgba(10,15,20,0.92)] px-2 py-1 shadow-[0_12px_24px_rgba(0,0,0,0.35)] backdrop-blur"
          style={{ top: bubbleStyle.top, left: bubbleStyle.left }}
        >
          <div className="flex items-center gap-1">
            <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('bold')} className={buttonClass(isActive('bold'))}><FiBold /></button>
            <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('italic')} className={buttonClass(isActive('italic'))}><FiItalic /></button>
            <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('underline')} className={buttonClass(isActive('underline'))}><FiUnderline /></button>
            <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('insertUnorderedList')} className={buttonClass(isActive('insertUnorderedList'))}><FiListBulleted /></button>
            <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('insertOrderedList')} className={buttonClass(isActive('insertOrderedList'))}><FiList /></button>
          </div>
        </div>
      )}

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
