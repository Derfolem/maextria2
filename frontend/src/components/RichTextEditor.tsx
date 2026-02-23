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
  FiInfo,
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

export default function RichTextEditor({
  value,
  onChange,
  onBlur,
  placeholder,
  minHeight = 160,
  className,
}: Props) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const editorViewportRef = useRef<HTMLDivElement | null>(null);
  const bubbleRef = useRef<HTMLDivElement | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [fontFamily, setFontFamily] = useState(FONT_FAMILIES[0]);
  const [fontSize, setFontSize] = useState(FONT_SIZES[1].value);
  const [moreOpen, setMoreOpen] = useState(false);
  const [showLabels, setShowLabels] = useState(false);
  const [bubbleVisible, setBubbleVisible] = useState(false);
  const [bubbleMoreOpen, setBubbleMoreOpen] = useState(false);
  const [, forceToolbarRefresh] = useState(0);
  const [bubbleStyle, setBubbleStyle] = useState<{ top: number; left: number; maxWidth: number }>({
    top: 0,
    left: 0,
    maxWidth: 320,
  });

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

  const refreshToolbarState = () => {
    forceToolbarRefresh((prev) => prev + 1);
  };

  useEffect(() => {
    const hideBubble = () => {
      setBubbleVisible(false);
      setBubbleMoreOpen(false);
    };

    const handleSelection = () => {
      if (!editorRef.current || !editorViewportRef.current) {
        hideBubble();
        return;
      }

      refreshToolbarState();

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
        hideBubble();
        return;
      }

      const range = selection.getRangeAt(0);
      const commonNode = range.commonAncestorContainer;
      if (!editorRef.current.contains(commonNode)) {
        hideBubble();
        return;
      }

      const rect = range.getBoundingClientRect();
      const viewportRect = editorViewportRef.current.getBoundingClientRect();
      if ((!rect.width && !rect.height) || viewportRect.width <= 0) {
        hideBubble();
        return;
      }

      const margin = 8;
      const maxWidth = Math.min(420, Math.max(160, viewportRect.width - margin * 2));
      const centerX = rect.left - viewportRect.left + rect.width / 2;
      const halfMaxWidth = maxWidth / 2;
      const minLeft = Math.min(viewportRect.width / 2, margin + halfMaxWidth);
      const maxLeft = Math.max(minLeft, viewportRect.width - margin - halfMaxWidth);
      const clampedLeft = Math.min(Math.max(centerX, minLeft), maxLeft);
      const aboveTop = rect.top - viewportRect.top - 52;
      const belowTop = rect.bottom - viewportRect.top + 8;
      const maxTop = Math.max(margin, viewportRect.height - 52);
      const top = aboveTop >= margin ? aboveTop : Math.min(belowTop, maxTop);

      setBubbleStyle({ top, left: clampedLeft, maxWidth });
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
    refreshToolbarState();
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
    const table = `<div style="display:inline-block; max-width:100%; resize:both; overflow:auto; border:1px dashed #64748b; padding:6px; border-radius:8px;">
      <table style="width:100%; border-collapse: collapse; border:1px solid #94a3b8; color: inherit;">${Array.from({ length: rows })
        .map(() => `<tr>${Array.from({ length: cols }).map(() => '<td style=\"padding:6px; border:1px solid #94a3b8; min-width:60px;\">&nbsp;</td>').join('')}</tr>`)
        .join('')}</table>
    </div><p><br></p>`;
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
  const labelProps = (label: string) => ({ title: label, 'aria-label': label });
  const bubbleBtnClass = (active?: boolean) =>
    `inline-flex h-8 w-8 items-center justify-center rounded-lg text-xs transition ${
      active
        ? 'bg-[rgba(64,173,190,0.22)] text-[hsl(var(--foreground))]'
        : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-white/5'
    }`;

  return (
    <div className={`rounded-[16px] border border-[hsl(var(--border))] bg-[hsl(var(--card))] ${className || ''}`}>
      <div className="border-b border-[hsl(var(--border))]/70 bg-[hsl(var(--graphite))] px-3 py-2">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <div className={groupClass}>
            <FiType className="text-[hsl(var(--muted-foreground))]" {...labelProps('Fonte')} />
            <select
              value={fontFamily}
              onChange={(event) => {
                setFontFamily(event.target.value);
                exec('fontName', event.target.value);
              }}
              className="bg-[hsl(var(--card))] text-xs text-[hsl(var(--foreground))] border border-[hsl(var(--border))] rounded-lg px-2 py-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
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
                className="bg-[hsl(var(--card))] text-xs text-[hsl(var(--foreground))] border border-[hsl(var(--border))] rounded-lg px-2 py-1 pr-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
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
            <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('bold')} className={buttonClass(isActive('bold'))} {...labelProps('Negrito')}>
              <FiBold />
            </button>
            <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('italic')} className={buttonClass(isActive('italic'))} {...labelProps('Itálico')}>
              <FiItalic />
            </button>
            <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('underline')} className={buttonClass(isActive('underline'))} {...labelProps('Sublinhado')}>
              <FiUnderline />
            </button>
            <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('strikeThrough')} className={buttonClass(isActive('strikeThrough'))} {...labelProps('Tachado')}>
              <FiSlash />
            </button>
            <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('formatBlock', '<h1>')} className={buttonClass(activeBlock() === 'h1')} {...labelProps('Título H1')}>
              H1
            </button>
            <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('formatBlock', '<h2>')} className={buttonClass(activeBlock() === 'h2')} {...labelProps('Título H2')}>
              H2
            </button>
            <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('formatBlock', '<h3>')} className={buttonClass(activeBlock() === 'h3')} {...labelProps('Título H3')}>
              H3
            </button>
            <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('formatBlock', '<p>')} className={buttonClass(activeBlock() === 'p')} {...labelProps('Parágrafo')}>
              P
            </button>
          </div>

          <div className={dividerClass} />

          <div className={groupClass}>
            <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('insertUnorderedList')} className={buttonClass(isActive('insertUnorderedList'))} {...labelProps('Lista com marcadores')}>
              <FiListBulleted />
            </button>
            <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('insertOrderedList')} className={buttonClass(isActive('insertOrderedList'))} {...labelProps('Lista numerada')}>
              <FiList />
            </button>
            <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('justifyLeft')} className={buttonClass(isActive('justifyLeft'))} {...labelProps('Alinhar à esquerda')}>
              <FiAlignLeft />
            </button>
            <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('justifyCenter')} className={buttonClass(isActive('justifyCenter'))} {...labelProps('Centralizar')}>
              <FiAlignCenter />
            </button>
            <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('justifyRight')} className={buttonClass(isActive('justifyRight'))} {...labelProps('Alinhar à direita')}>
              <FiAlignRight />
            </button>
            <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('justifyFull')} className={buttonClass(isActive('justifyFull'))} {...labelProps('Justificar')}>
              <FiAlignJustify />
            </button>
          </div>

          <div className={dividerClass} />

          <div className={`${groupClass} hidden lg:flex`}>
            <input
              type="color"
              onChange={(event) => exec('foreColor', event.target.value)}
              className="h-8 w-9 rounded-lg border border-[hsl(var(--border))]/60 bg-transparent"
              {...labelProps('Cor do texto')}
            />
            <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('hiliteColor', '#2dd4bf')} className={buttonClass()} {...labelProps('Cor de fundo')}>
              <FiDroplet />
            </button>
            <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('formatBlock', '<blockquote>')} className={buttonClass(activeBlock() === 'blockquote')} {...labelProps('Citação')}>
              <FiMessageSquare />
            </button>
            <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('formatBlock', '<pre>')} className={buttonClass(activeBlock() === 'pre')} {...labelProps('Código')}>
              <FiCode />
            </button>
          </div>

          <div className={dividerClass} />

          <div className={`${groupClass} hidden lg:flex`}>
            <button type="button" onMouseDown={handleMouseDown} onClick={insertImage} className={buttonClass()} {...labelProps('Inserir imagem')}>
              <FiImage />
            </button>
            <button type="button" onMouseDown={handleMouseDown} onClick={insertTable} className={buttonClass()} {...labelProps('Inserir tabela')}>
              <FiGrid />
            </button>
            <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('insertHorizontalRule')} className={buttonClass()} {...labelProps('Linha horizontal')}>
              <FiMinus />
            </button>
          </div>

          <div className={dividerClass} />

          <div className={groupClass}>
            <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('removeFormat')} className={buttonClass()} {...labelProps('Limpar formatação')}>
              <FiDelete />
            </button>
            <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('undo')} className={buttonClass()} {...labelProps('Desfazer')}>
              <FiRotateCcw />
            </button>
            <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('redo')} className={buttonClass()} {...labelProps('Refazer')}>
              <FiRotateCw />
            </button>
          </div>

          <div className="ml-auto flex items-center gap-2 lg:hidden">
            <button
              type="button"
              onMouseDown={handleMouseDown}
              onClick={() => setMoreOpen((prev) => !prev)}
              className={buttonClass(moreOpen)}
              {...labelProps('Mais ferramentas')}
            >
              <FiMoreHorizontal />
            </button>
            <button
              type="button"
              onMouseDown={handleMouseDown}
              onClick={() => setShowLabels((prev) => !prev)}
              className={buttonClass(showLabels)}
              {...labelProps('Mostrar rótulos')}
            >
              <FiInfo />
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
            <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('formatBlock', '<blockquote>')} className={buttonClass(activeBlock() === 'blockquote')} {...labelProps('Citação')}>
              <FiMessageSquare />
            </button>
            <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('formatBlock', '<pre>')} className={buttonClass(activeBlock() === 'pre')} {...labelProps('Código')}>
              <FiCode />
            </button>
            <input
              type="color"
              onChange={(event) => exec('foreColor', event.target.value)}
              className="h-8 w-9 rounded-lg border border-[hsl(var(--border))]/60 bg-transparent"
              {...labelProps('Cor do texto')}
            />
            <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('hiliteColor', '#2dd4bf')} className={buttonClass()} {...labelProps('Cor de fundo')}>
              <FiDroplet />
            </button>
            <button type="button" onMouseDown={handleMouseDown} onClick={insertImage} className={buttonClass()} {...labelProps('Inserir imagem')}>
              <FiImage />
            </button>
            <button type="button" onMouseDown={handleMouseDown} onClick={insertTable} className={buttonClass()} {...labelProps('Inserir tabela')}>
              <FiGrid />
            </button>
            <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('insertHorizontalRule')} className={buttonClass()} {...labelProps('Linha horizontal')}>
              <FiMinus />
            </button>
          </div>
        )}

        {showLabels && (
          <div className="mt-3 flex flex-wrap gap-2 border-t border-[hsl(var(--border))]/70 pt-3 text-xs text-[hsl(var(--muted-foreground))] lg:hidden">
            <span>Negrito</span>
            <span>Itálico</span>
            <span>Sublinhado</span>
            <span>Tachado</span>
            <span>H1</span>
            <span>H2</span>
            <span>H3</span>
            <span>Parágrafo</span>
            <span>Lista</span>
            <span>Numeração</span>
            <span>Alinhamentos</span>
            <span>Cores</span>
            <span>Citação</span>
            <span>Código</span>
            <span>Imagem</span>
            <span>Tabela</span>
            <span>Linha</span>
            <span>Limpar</span>
            <span>Desfazer</span>
            <span>Refazer</span>
          </div>
        )}
      </div>

      <div className="relative" ref={editorViewportRef}>
        {bubbleVisible && (
          <div
            ref={bubbleRef}
            className="absolute z-20 -translate-x-1/2 rounded-xl border border-[hsl(var(--border))]/70 bg-[rgba(10,15,20,0.94)] px-2 py-1 shadow-[0_12px_24px_rgba(0,0,0,0.35)] backdrop-blur"
            style={{ top: bubbleStyle.top, left: bubbleStyle.left, maxWidth: bubbleStyle.maxWidth, width: 'max-content' }}
          >
            <div className="flex items-center gap-1">
              <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('bold')} className={bubbleBtnClass(isActive('bold'))} {...labelProps('Negrito')}><FiBold /></button>
              <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('italic')} className={bubbleBtnClass(isActive('italic'))} {...labelProps('Itálico')}><FiItalic /></button>
              <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('underline')} className={bubbleBtnClass(isActive('underline'))} {...labelProps('Sublinhado')}><FiUnderline /></button>
              <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('strikeThrough')} className={bubbleBtnClass(isActive('strikeThrough'))} {...labelProps('Tachado')}><FiSlash /></button>
              <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('insertUnorderedList')} className={bubbleBtnClass(isActive('insertUnorderedList'))} {...labelProps('Lista com marcadores')}><FiListBulleted /></button>
              <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('insertOrderedList')} className={bubbleBtnClass(isActive('insertOrderedList'))} {...labelProps('Lista numerada')}><FiList /></button>
              <button
                type="button"
                onMouseDown={handleMouseDown}
                onClick={() => setBubbleMoreOpen((prev) => !prev)}
                className={bubbleBtnClass(bubbleMoreOpen)}
                {...labelProps('Mais opções')}
              >
                <FiMoreHorizontal />
              </button>
            </div>
            {bubbleMoreOpen && (
              <div className="mt-1 grid grid-cols-4 gap-1 border-t border-white/10 pt-1 sm:grid-cols-6">
                <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('justifyLeft')} className={bubbleBtnClass(isActive('justifyLeft'))} {...labelProps('Alinhar à esquerda')}><FiAlignLeft /></button>
                <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('justifyCenter')} className={bubbleBtnClass(isActive('justifyCenter'))} {...labelProps('Centralizar')}><FiAlignCenter /></button>
                <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('justifyRight')} className={bubbleBtnClass(isActive('justifyRight'))} {...labelProps('Alinhar à direita')}><FiAlignRight /></button>
                <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('justifyFull')} className={bubbleBtnClass(isActive('justifyFull'))} {...labelProps('Justificar')}><FiAlignJustify /></button>
                <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('formatBlock', '<h2>')} className={bubbleBtnClass(activeBlock() === 'h2')} {...labelProps('Título H2')}>H2</button>
                <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('formatBlock', '<p>')} className={bubbleBtnClass(activeBlock() === 'p')} {...labelProps('Parágrafo')}>P</button>
                <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('hiliteColor', '#2dd4bf')} className={bubbleBtnClass()} {...labelProps('Realçar')}><FiDroplet /></button>
                <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('removeFormat')} className={bubbleBtnClass()} {...labelProps('Limpar formatação')}><FiDelete /></button>
                <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('undo')} className={bubbleBtnClass()} {...labelProps('Desfazer')}><FiRotateCcw /></button>
                <button type="button" onMouseDown={handleMouseDown} onClick={() => exec('redo')} className={bubbleBtnClass()} {...labelProps('Refazer')}><FiRotateCw /></button>
              </div>
            )}
          </div>
        )}

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
          onFocus={() => {
            setIsFocused(true);
            refreshToolbarState();
          }}
          onKeyUp={refreshToolbarState}
          onMouseUp={refreshToolbarState}
          onBlur={() => {
            setIsFocused(false);
            setBubbleMoreOpen(false);
            syncValue();
            onBlur?.(editorRef.current?.innerHTML || '');
          }}
          suppressContentEditableWarning
        />
      </div>
    </div>
  );
}
