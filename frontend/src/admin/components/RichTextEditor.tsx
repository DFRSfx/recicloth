import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, List, ListOrdered, Heading1, Heading2, Undo2, Redo2, Code } from 'lucide-react';
import '../styles/editor.css';

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
}

export default function RichTextEditor({ value, onChange, placeholder = 'Escreva a descrição...', label = 'Descrição', error }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    immediatelyRender: false,
  });

  if (!editor) {
    return null;
  }

  const buttonClass = 'p-2 rounded hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  const activeButtonClass = 'bg-primary-100 text-primary-700';

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      {/* Toolbar */}
      <div className={`border border-gray-300 rounded-t-lg bg-gray-50 p-2 flex flex-wrap gap-0.5 ${error ? 'border-red-500' : ''}`}>
        {/* Undo/Redo */}
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className={buttonClass}
          title="Desfazer (Ctrl+Z)"
          type="button"
          aria-label="Desfazer"
        >
          <Undo2 size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className={buttonClass}
          title="Refazer (Ctrl+Y)"
          type="button"
          aria-label="Refazer"
        >
          <Redo2 size={18} />
        </button>

        <div className="w-px bg-gray-300 mx-1"></div>

        {/* Headings */}
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`${buttonClass} ${editor.isActive('heading', { level: 1 }) ? activeButtonClass : ''}`}
          title="Título 1"
          type="button"
          aria-label="Título 1"
        >
          <Heading1 size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`${buttonClass} ${editor.isActive('heading', { level: 2 }) ? activeButtonClass : ''}`}
          title="Título 2"
          type="button"
          aria-label="Título 2"
        >
          <Heading2 size={18} />
        </button>

        <div className="w-px bg-gray-300 mx-1"></div>

        {/* Text styles */}
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={`${buttonClass} ${editor.isActive('bold') ? activeButtonClass : ''}`}
          title="Negrito (Ctrl+B)"
          type="button"
          aria-label="Negrito"
        >
          <Bold size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={`${buttonClass} ${editor.isActive('italic') ? activeButtonClass : ''}`}
          title="Itálico (Ctrl+I)"
          type="button"
          aria-label="Itálico"
        >
          <Italic size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`${buttonClass} ${editor.isActive('codeBlock') ? activeButtonClass : ''}`}
          title="Bloco de código"
          type="button"
          aria-label="Bloco de código"
        >
          <Code size={18} />
        </button>

        <div className="w-px bg-gray-300 mx-1"></div>

        {/* Lists */}
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`${buttonClass} ${editor.isActive('bulletList') ? activeButtonClass : ''}`}
          title="Lista com pontos"
          type="button"
          aria-label="Lista com pontos"
        >
          <List size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`${buttonClass} ${editor.isActive('orderedList') ? activeButtonClass : ''}`}
          title="Lista numerada"
          type="button"
          aria-label="Lista numerada"
        >
          <ListOrdered size={18} />
        </button>
      </div>

      {/* Editor */}
      <div className={`border border-t-0 border-gray-300 rounded-b-lg overflow-hidden bg-white ${error ? 'border-red-500' : ''}`}>
        <EditorContent
          editor={editor}
          className="tiptap-editor"
        />
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-1.5 text-sm text-red-500">{error}</p>
      )}

      {/* Character count */}
      <div className="mt-2 text-xs text-gray-500">
        {editor.getText().length} caracteres
      </div>
    </div>
  );
}
