import { nextTick, type Ref } from "vue";

export function useTemplateInsert(
  textareaRef: Ref<HTMLTextAreaElement | null>,
  textRef: Ref<string>
) {
  function insertAtCursor(placeholder: string) {
    const textarea = textareaRef.value;
    if (!textarea) {
      textRef.value = `${textRef.value}${placeholder}`;
      return;
    }

    const start = textarea.selectionStart ?? textRef.value.length;
    const end = textarea.selectionEnd ?? start;
    textRef.value =
      textRef.value.slice(0, start) + placeholder + textRef.value.slice(end);

    nextTick(() => {
      const cursor = start + placeholder.length;
      textarea.focus();
      textarea.setSelectionRange(cursor, cursor);
    });
  }

  return { insertAtCursor };
}
