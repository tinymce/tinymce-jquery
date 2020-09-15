import { editor } from './Editor';
import { getJquery } from './JQuery';
import { getTinymceInstance } from './TinyMCE';

const jq = getJquery();
// Add :tinymce pseudo selector this will select elements that has been converted into editor instances
// it's now possible to use things like $('*:tinymce') to get all TinyMCE bound elements.
jq.expr.pseudos.tinymce = (e: Element) => !!getTinymceInstance(e);
// Add a tinymce function for creating editors
(jq.fn as any).tinymce = editor;