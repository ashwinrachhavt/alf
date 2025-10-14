"use client";
import { useEffect } from "react";

// Lazy import to avoid SSR issues if packages are absent during initial setup
let EditorContent: any = null;
let useEditor: any = null;
let StarterKit: any = null;
let Link: any = null;
let Placeholder: any = null;

const loaded = {
  tiptap: false,
};

async function loadTiptap() {
  if (loaded.tiptap) return;
  const [react, starter, link, placeholder] = await Promise.all([
    import("@tiptap/react"),
    import("@tiptap/starter-kit"),
    import("@tiptap/extension-link"),
    import("@tiptap/extension-placeholder"),
  ]);
  EditorContent = react.EditorContent;
  useEditor = react.useEditor;
  StarterKit = starter.default;
  Link = link.default;
  Placeholder = placeholder.default;
  loaded.tiptap = true;
}

export type TiptapDoc = any;

export default function TiptapEditor({
  value,
  onChange,
  placeholder,
}: {
  value: TiptapDoc | null;
  onChange: (doc: TiptapDoc) => void;
  placeholder?: string;
}) {
  // Load tiptap libs on the client
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    loadTiptap();
  }, []);

  if (!loaded.tiptap) {
    return (
      <div className="border rounded-md p-3 text-sm text-neutral-500">
        Loading editor… If this persists, run: npm i @tiptap/react @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-placeholder
      </div>
    );
  }

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: true }),
      Link.configure({ openOnClick: true }),
      Placeholder.configure({ placeholder: placeholder || "Write your research…" }),
    ],
    content: value ?? { type: "doc", content: [{ type: "paragraph" }] },
    autofocus: true,
    // Avoid hydration mismatches in SSR
    immediatelyRender: false,
    onUpdate: ({ editor }: any) => {
      try {
        const json = editor.getJSON();
        onChange(json);
      } catch {}
    },
  });

  return (
    <div className="tiptap border rounded-md">
      <div className="flex items-center gap-2 border-b p-2 text-xs">
        <button className="border px-2 h-7 rounded" onClick={() => editor?.chain().focus().toggleBold().run()}>Bold</button>
        <button className="border px-2 h-7 rounded" onClick={() => editor?.chain().focus().toggleItalic().run()}>Italic</button>
        <button className="border px-2 h-7 rounded" onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button>
        <button className="border px-2 h-7 rounded" onClick={() => editor?.chain().focus().toggleBulletList().run()}>• List</button>
        <button className="border px-2 h-7 rounded" onClick={() => editor?.chain().focus().toggleOrderedList().run()}>1. List</button>
        <button className="border px-2 h-7 rounded" onClick={() => editor?.chain().focus().toggleCodeBlock().run()}>Code</button>
      </div>
      <div className="p-2 min-h-[50vh]">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
