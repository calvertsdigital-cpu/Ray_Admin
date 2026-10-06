/**
 * RichTextEditor — Word-like WYSIWYG editor built on TipTap.
 * Toolbar: Bold · Italic · Underline · Strikethrough · H1 · H2 · H3
 *          Bullet list · Ordered list · Blockquote · Link · Clear
 * Outputs HTML string via onChange(html).
 */
import React, { useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';

/* ── Toolbar button ─────────────────────────────────── */
function ToolBtn({ onClick, active, disabled, title, children }) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      disabled={disabled}
      style={{
        padding: '4px 7px',
        borderRadius: 5,
        border: active ? '1px solid #77a13d' : '1px solid transparent',
        background: active ? '#e8f3d6' : 'transparent',
        color: active ? '#3a5a1a' : '#374151',
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: active ? 700 : 400,
        lineHeight: 1,
        minWidth: 28,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.1s',
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = '#f3f4f6'; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div style={{ width: 1, height: 20, background: '#e5e7eb', margin: '0 4px' }} />;
}

/* ── Main component ────────────────────────────────── */
export default function RichTextEditor({ value, onChange, placeholder = 'Write your content here…', minHeight = 320 }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer', style: 'color: #2563eb; text-decoration: underline;' },
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        style: `min-height: ${minHeight}px; padding: 14px 16px; outline: none; font-size: 14px; line-height: 1.7; color: #111827;`,
      },
    },
  });

  const setLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes('link').href;
    const url = window.prompt('Enter URL', prev || 'https://');
    if (url === null) return;
    if (url === '') { editor.chain().focus().extendMarkRange('link').unsetLink().run(); return; }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return null;

  const btn = (action, label, isActive) => ({ onClick: action, active: isActive, title: label });

  return (
    <div style={{ border: '1px solid #d1d5db', borderRadius: 8, overflow: 'hidden', background: 'white' }}>

      {/* ── Toolbar ── */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2,
        padding: '6px 10px', borderBottom: '1px solid #e5e7eb', background: '#fafafa',
      }}>

        {/* Text style */}
        <ToolBtn {...btn(() => editor.chain().focus().toggleBold().run(), 'Bold (Ctrl+B)', editor.isActive('bold'))}>
          <strong>B</strong>
        </ToolBtn>
        <ToolBtn {...btn(() => editor.chain().focus().toggleItalic().run(), 'Italic (Ctrl+I)', editor.isActive('italic'))}>
          <em>I</em>
        </ToolBtn>
        <ToolBtn {...btn(() => editor.chain().focus().toggleUnderline().run(), 'Underline (Ctrl+U)', editor.isActive('underline'))}>
          <span style={{ textDecoration: 'underline' }}>U</span>
        </ToolBtn>
        <ToolBtn {...btn(() => editor.chain().focus().toggleStrike().run(), 'Strikethrough', editor.isActive('strike'))}>
          <span style={{ textDecoration: 'line-through' }}>S</span>
        </ToolBtn>

        <Divider />

        {/* Headings */}
        <ToolBtn {...btn(() => editor.chain().focus().toggleHeading({ level: 1 }).run(), 'Heading 1', editor.isActive('heading', { level: 1 }))}>
          H1
        </ToolBtn>
        <ToolBtn {...btn(() => editor.chain().focus().toggleHeading({ level: 2 }).run(), 'Heading 2', editor.isActive('heading', { level: 2 }))}>
          H2
        </ToolBtn>
        <ToolBtn {...btn(() => editor.chain().focus().toggleHeading({ level: 3 }).run(), 'Heading 3', editor.isActive('heading', { level: 3 }))}>
          H3
        </ToolBtn>

        <Divider />

        {/* Lists */}
        <ToolBtn {...btn(() => editor.chain().focus().toggleBulletList().run(), 'Bullet list', editor.isActive('bulletList'))}>
          ≡
        </ToolBtn>
        <ToolBtn {...btn(() => editor.chain().focus().toggleOrderedList().run(), 'Numbered list', editor.isActive('orderedList'))}>
          1≡
        </ToolBtn>

        <Divider />

        {/* Alignment */}
        <ToolBtn {...btn(() => editor.chain().focus().setTextAlign('left').run(), 'Align left', editor.isActive({ textAlign: 'left' }))}>
          ◀
        </ToolBtn>
        <ToolBtn {...btn(() => editor.chain().focus().setTextAlign('center').run(), 'Align center', editor.isActive({ textAlign: 'center' }))}>
          ▶◀
        </ToolBtn>
        <ToolBtn {...btn(() => editor.chain().focus().setTextAlign('right').run(), 'Align right', editor.isActive({ textAlign: 'right' }))}>
          ▶
        </ToolBtn>

        <Divider />

        {/* Quote + HR */}
        <ToolBtn {...btn(() => editor.chain().focus().toggleBlockquote().run(), 'Blockquote', editor.isActive('blockquote'))}>
          "
        </ToolBtn>
        <ToolBtn {...btn(() => editor.chain().focus().setHorizontalRule().run(), 'Horizontal rule', false)}>
          —
        </ToolBtn>

        <Divider />

        {/* Link */}
        <ToolBtn {...btn(setLink, 'Insert / edit link', editor.isActive('link'))}>
          🔗
        </ToolBtn>
        <ToolBtn {...btn(() => editor.chain().focus().unsetLink().run(), 'Remove link', false)}>
          🔗✕
        </ToolBtn>

        <Divider />

        {/* Undo / Redo */}
        <ToolBtn onClick={() => editor.chain().focus().undo().run()} active={false} title="Undo (Ctrl+Z)" disabled={!editor.can().undo()}>
          ↩
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().redo().run()} active={false} title="Redo (Ctrl+Y)" disabled={!editor.can().redo()}>
          ↪
        </ToolBtn>

        <Divider />

        {/* Clear formatting */}
        <ToolBtn {...btn(() => editor.chain().focus().clearNodes().unsetAllMarks().run(), 'Clear all formatting', false)}>
          ✕T
        </ToolBtn>

        {/* Word count */}
        <div style={{ marginLeft: 'auto', fontSize: 11, color: '#9ca3af', paddingRight: 4, whiteSpace: 'nowrap' }}>
          {editor.storage?.characterCount?.words?.() ?? editor.getText().split(/\s+/).filter(Boolean).length} words
        </div>
      </div>

      {/* ── Editor area ── */}
      <EditorContent
        editor={editor}
        style={{ cursor: 'text' }}
        onClick={() => editor.commands.focus()}
      />

      {/* ── Editor styles injected inline ── */}
      <style>{`
        .ProseMirror p { margin: 0 0 0.75em; }
        .ProseMirror h1 { font-size: 1.6em; font-weight: 700; margin: 1em 0 0.4em; }
        .ProseMirror h2 { font-size: 1.3em; font-weight: 700; margin: 0.9em 0 0.4em; }
        .ProseMirror h3 { font-size: 1.1em; font-weight: 600; margin: 0.8em 0 0.3em; }
        .ProseMirror ul { list-style: disc; padding-left: 1.4em; margin: 0.5em 0; }
        .ProseMirror ol { list-style: decimal; padding-left: 1.4em; margin: 0.5em 0; }
        .ProseMirror li { margin: 0.2em 0; }
        .ProseMirror blockquote { border-left: 3px solid #77a13d; padding-left: 12px; margin: 0.75em 0; color: #6b7280; font-style: italic; }
        .ProseMirror hr { border: none; border-top: 2px solid #e5e7eb; margin: 1em 0; }
        .ProseMirror a { color: #2563eb; text-decoration: underline; }
        .ProseMirror strong { font-weight: 700; }
        .ProseMirror em { font-style: italic; }
        .ProseMirror s { text-decoration: line-through; }
        .ProseMirror p.is-editor-empty:first-child::before { content: attr(data-placeholder); color: #9ca3af; pointer-events: none; height: 0; float: left; }
        .ProseMirror:focus { outline: none; }
        .ProseMirror code { background: #f3f4f6; padding: 1px 5px; border-radius: 4px; font-family: monospace; font-size: 0.9em; }
        .ProseMirror pre { background: #1e1e2e; color: #cdd6f4; padding: 12px 16px; border-radius: 8px; overflow-x: auto; margin: 0.75em 0; }
        .ProseMirror pre code { background: none; color: inherit; padding: 0; }
      `}</style>
    </div>
  );
}
