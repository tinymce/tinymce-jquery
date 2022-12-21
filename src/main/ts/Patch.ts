import { Obj, Thunk, Type } from '@ephox/katamari';
import { SandHTMLElement } from '@ephox/sand';
import { Editor } from 'tinymce';
import { getTinymce, withTinymceInstance } from './TinyMCE';

/**
 * Run a callback for each editor inside the subject elements.
 * @param subject the jQuery element set to search.
 * @param callback the callback to call for any editor found.
 */
const withEachContainedEditor = (
  subject: JQuery<HTMLElement>,
  callback: (ed: Editor, inside: HTMLElement, subject: JQuery<HTMLElement>) => void | false
) => {
  // Look for editors that are contained within the jQuery subjects
  subject.each((i, elem) => {
    for (const editor of getTinymce().get()) {
      if ($.contains(elem, editor.getContentAreaContainer())) {
        if (callback(editor, elem, subject) === false) {
          return false;
        }
      }
    }
    return;
  });
};

/**
 * Run a callback for any editor associated with the subject elements.
 * @param subject the jQuery element set to search.
 * @param callback the callback to call for any associated editor found.
 */
const withEachLinkedEditor = (
  subject: JQuery<HTMLElement>,
  callback: (ed: Editor, associated: HTMLElement, subject: JQuery<HTMLElement>) => void | false
) => {
  subject.each((_i, elm) => withTinymceInstance(elm, (ed) => callback(ed, elm, subject)));
};

/**
 * Remove all editors associated with the element set.
 * @param subject the jQuery element set to search.
 */
const removeTargetElementEditor = (subject: JQuery<HTMLElement>) => withEachLinkedEditor(subject, (ed) => ed.remove());

/**
 * Remove all editors inside the element set.
 * @param subject the jQuery element set to search.
 */
const removeChildEditors = (subject: JQuery<HTMLElement>) => withEachContainedEditor(subject, (ed) => ed.remove());

/**
 * Remove editors associated with the target elements in subject
 * and remove any editors on descendants of subject.
 *
 * @param subject the element set to remove editors.
 */
const removeEditors = (subject: JQuery<HTMLElement>) => {
  removeTargetElementEditor(subject);
  removeChildEditors(subject);
};

/** type of jQuery's attr function */
type JQueryAttrFn = JQueryStatic['fn']['attr'];

type JQueryAttrValue = string | number | null | undefined;
type JQueryAttrProducer = (this: HTMLElement, index: number, attr: JQueryAttrValue) => JQueryAttrValue;
type JQueryAttrValueOrProducer = JQueryAttrValue | JQueryAttrProducer;
type JQueryAttrParams = [name: string] | [attributes: Record<string, JQueryAttrValueOrProducer>] | [name: string, value: JQueryAttrValueOrProducer];

/**
 * Patch jQuery's `attr` function.
 *
 * Makes sure that $('#tinymce_id').attr('value') gets the editors current HTML contents
 *
 * @param origAttrFn the original `attr()` function.
 * @returns the patched `attr()` function.
 */
const patchJqAttr = (origAttrFn: JQueryAttrFn): JQueryAttrFn =>
  function (this: JQuery<HTMLElement>, ...args: JQueryAttrParams): string | undefined | JQuery<HTMLElement> {
    // Helper to set the value attribute or TinyMCE's content
    const setValue = (valueOrProducer: JQueryAttrValueOrProducer) => {
      if (valueOrProducer === undefined) {
        return;
      }
      // When using inline editors you could in theory initialize TinyMCE on
      // a element inside the editor. This is meant to remove those editors
      // before we accidentally overwrite them.
      removeChildEditors(this);
      this.each((i, elm) => withTinymceInstance(elm, (ed) => {
        const value = Type.isFunction(valueOrProducer) ? valueOrProducer.call(elm, i, ed.getContent()) : valueOrProducer;
        if (value !== undefined) {
          ed.setContent(value === null ? '' : `${value}`);
        }
      }, (el) => {
        if (Type.isFunction(valueOrProducer)) {
          // these steps are so the correct index is passed to the producer fn
          const origValue = origAttrFn.call($(el), 'value');
          const newValue = valueOrProducer.call(el, i, origValue as string);
          (origAttrFn as Function).call($(el), 'value', newValue);
        } else {
          (origAttrFn as Function).call($(el), 'value', valueOrProducer);
        }
      }));
    };

    const nameOrBatch = args[0];
    if (Type.isString(nameOrBatch)) {
      const name = nameOrBatch;
      if (name !== 'value') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        return origAttrFn.apply(this, args as any);
      }
      const value = args[1];
      if (value !== undefined) {
        setValue(value);
        return this;
      } else {
        // when the value is undefined get the value
        if (this.length >= 1) {
          return withTinymceInstance(this[0],
            (ed) => ed.getContent(),
            (_elm) => origAttrFn.call(this, 'value')
          );
        }
        // when no elements exist to get the value attribute return undefined
        return undefined;
      }
    } else {
      const batch = { ...nameOrBatch };
      if (Obj.has(batch, 'value')) {
        setValue(batch.value);
        delete batch.value;
      }
      return Obj.keys(batch).length > 0 ? (origAttrFn as Function).call(this, batch) : this;
    }
  } as JQueryAttrFn;

/** Type of jQuery remove function */
type JQueryRemoveFn = JQueryStatic['fn']['remove'];

/**
 * Patch jQuery's `remove` function.
 *
 * The `remove` function removes the original or selected nodes from the DOM,
 * hence any existing selected TinyMCE editor should be destroyed.
 *
 * @param origFn the original function.
 * @returns the patched function.
 */
const patchJqRemove = (origFn: JQueryRemoveFn): JQueryRemoveFn =>
  function <T extends HTMLElement>(this: JQuery<T>, selector?: string): JQuery<T> {
    removeEditors(selector !== undefined ? this.filter(selector) : this);
    return origFn.call(this, selector) as JQuery<T>;
  };

/** Type of jQuery's `empty` function */
type JQueryEmptyFn = JQueryStatic['fn']['empty'];

/**
 * Patch jQuery's `empty` function.
 *
 * The `empty` function removes all children of the node set, hence any child
 * editors of the node set must be destroyed. Additionally the content of any
 * linked editors should be cleared to match.
 *
 * @param origFn the original function.
 * @returns the patched function.
 */
const patchJqEmpty = (origFn: JQueryEmptyFn): JQueryEmptyFn =>
  function (this: JQuery<HTMLElement>) {
    // as we are deleting the content of all in `this` we must first remove the editors
    removeChildEditors(this);
    // all editors linked to `this` must be emptied too
    withEachLinkedEditor(this, (ed) => void ed.setContent(''));
    // finally do the empty call
    return origFn.call(this);
  };

/** Type for `append` and `prepend` */
type JQueryPendFn = JQueryStatic['fn']['append'];
/** content that can be appended or prepended */
type JQueryPendContent = JQuery.htmlString | JQuery.TypeOrArray<JQuery.Node | JQuery<JQuery.Node>>;
/** function that produces content that can be appended or prepended */
type JQueryPendProducer = (this: HTMLElement, index: number, html: string) => JQueryPendContent;
/**
 * Converts various content types into one string.
 * @param content the content to stringify.
 * @returns the content converted into a html string.
 */
const stringifyContent = (origFn: JQueryPendFn, content: JQueryPendContent[]): string => {
  type PendContentType = (...contents: (string | JQuery.TypeOrArray<JQuery.Node | JQuery<JQuery.Node>>)[]) => JQuery<HTMLElement>;
  const dummy = document.createElement('div');
  (origFn as PendContentType).apply($(dummy), content);
  return dummy.innerHTML;
};

/**
 * Patch jQuery's `append` or `prepend` functions.
 *
 * Makes it possible to use $('#id').append("content"); to append contents to the TinyMCE editor iframe
 *
 * @param origFn the original function.
 * @param position the position to add the content.
 * @returns the patched function.
 */
const patchJqPend = (origFn: JQueryPendFn, position: 'append' | 'prepend'): JQueryPendFn =>
  function (this: JQuery<HTMLElement>, ...args: [JQueryPendProducer] | JQueryPendContent[]) {
    const prepend = position === 'prepend';
    let contentStr: (elm: HTMLElement, origContent: string) => string;
    if (args.length === 1 && Type.isFunction(args[0])) {
      const contentFn = args[0] as JQueryPendProducer;
      contentStr = (el: HTMLElement, origContent: string) => stringifyContent(origFn, [ contentFn.call(el, 0, origContent) ]);
    } else {
      const content = args as JQueryPendContent[];
      contentStr = Thunk.cached((_el: HTMLElement, _origContent: string) => stringifyContent(origFn, content));
    }
    this.each((_i2, elm) => withTinymceInstance(elm,
      (ed) => {
        const oldContent = ed.getContent();
        const addition = contentStr(elm, oldContent);
        ed.setContent(prepend ? addition + oldContent : oldContent + addition);
      },
      (el) => void (origFn as Function).apply($(el), args)
    ));
    return this;
  };

type JQueryHtmlFn = JQueryStatic['fn']['html'];

type JQueryHtmlValue = string | JQuery.Node;
type JQueryHtmlProducer = (this: HTMLElement, index: number, oldhtml: string) => JQueryHtmlValue;
/**
 * Patch jQuery's `html` function.
 *
 * The `html` function can either get or set HTML content.
 *
 * When no value is supplied it will get the content of the first element so
 * we check if the first element is linked to an editor and return that value
 * when needed.
 *
 * When a value is supplied it will set the innerHTML or move the supplied node
 * to replace the content. This means that nested editors must be destroyed first.
 * Then if a node is supplied we must get the innerHTML of that node to set
 *
 * @param origFn the original function.
 * @returns the patched function
 */
const patchJqHtml = (origFn: JQueryHtmlFn): JQueryHtmlFn =>
  function (this: JQuery<HTMLElement>, htmlOrNodeOrProducer?: JQueryHtmlValue | JQueryHtmlProducer): string | JQuery<HTMLElement> | undefined {
    // behave like original jQuery if argument is omitted
    if (arguments.length === 0) { // get the HTML value
      if (this.length >= 1) {
        // when more than one item exists the value of the first one is retrieved
        return withTinymceInstance(this[0], (ed) => ed.getContent(), (el) => origFn.call($(el)));
      }
      // Though this is not in the types; experimentation shows
      // that when no item is present jQuery returns `undefined`.
      return undefined;
    } else { // set the HTML value
      // type of the setter function, annoying typescript 4.5 can't seem to infer this...
      type HtmlSetterType = (htmlString_function: JQueryHtmlValue | JQueryHtmlProducer) => JQuery<HTMLElement>;
      // first we need to remove any editors we would overwrite
      removeChildEditors(this);
      // for all the nodes
      this.each((i, el) => {
        withTinymceInstance(el, (ed) => {
          // evaluate any producer to get the value
          const htmlOrNode = (
            Type.isFunction(htmlOrNodeOrProducer)
              ? htmlOrNodeOrProducer.call(el, i, ed.getContent())
              : htmlOrNodeOrProducer
          );
          // convert a node into html
          const html = (
            Type.isString(htmlOrNode)
              ? htmlOrNode
              : (() => {
                if (SandHTMLElement.isPrototypeOf(htmlOrNode)) {
                  // if the node might have an editor remove it first.
                  // TODO consider if we should copy the editor content instead?
                  removeEditors($(htmlOrNode));
                }
                // to get consistency let jQuery do the move and then use the content
                // also if jQuery handles things not listed in the types this should
                // hopefully allow us to work gracefully...
                const elem = document.createElement('div');
                (origFn as HtmlSetterType).call($(elem), htmlOrNode ?? '');
                return elem.innerHTML;
              })()
          );
          // finally update the editor with the html
          ed.setContent(html);
        }, (elm) => {
          if (Type.isFunction(htmlOrNodeOrProducer)) {
            // these steps are so the correct index is passed to the producer fn
            const origValue = origFn.call($(el));
            const newValue = htmlOrNodeOrProducer.call(el, i, origValue);
            (origFn as HtmlSetterType).call($(el), newValue);
          } else {
            (origFn as HtmlSetterType).call($(elm), htmlOrNodeOrProducer ?? '');
          }
        });
      });
      return this;
    }
  } as JQueryHtmlFn;

type JQueryTextFn = JQueryStatic['fn']['text'];

type JQueryTextValue = string | number | boolean;
type JQueryTextProducer = (this: HTMLElement, index: number, text: string) => JQueryTextValue;

/**
 * Patch jQuery's `text` function.
 *
 * @param origFn the original function.
 * @returns the patched function.
 */
const patchJqText = (origFn: JQueryTextFn): JQueryTextFn =>
  function (this: JQuery<HTMLElement>, valueOrProducer?: JQueryTextValue | JQueryTextProducer): string | JQuery<HTMLElement> {
    // behave like original jQuery if argument is omitted
    if (arguments.length === 0) { // get text value
      // get the concatenated text value of all elements in the set
      // (which is different to HTML which just gets the first)
      // when no elements in the set it returns empty string
      let out = '';
      this.each((_i, el) => {
        out += withTinymceInstance(el,
          (ed) => ed.getContent({ format: 'text' }),
          (elm) => origFn.call($(elm))
        );
      });
      return out;
    } else { // set text value
      type TextSetterType = (valueOrProducer: JQueryTextValue | JQueryTextProducer) => JQuery<HTMLElement>;
      // first we need to remove any editors we would overwrite
      removeChildEditors(this);
      // for all the nodes
      this.each((i, el) => {
        withTinymceInstance(el, (ed) => {
          // evaluate any producer to get the value
          const val = Type.isFunction(valueOrProducer) ? valueOrProducer.call(el, i, ed.getContent({ format: 'text' })) : valueOrProducer;
          // set the text on a dummy element so we can extract the HTML and set it on TinyMCE
          // note that we deliberately don't use jQuery here as it seems to use textContent
          // and the result is not useful...
          const dummy = document.createElement('div');
          dummy.innerText = `${val}`;
          ed.setContent(dummy.innerHTML);
        }, (elm) => {
          if (Type.isFunction(valueOrProducer)) {
            // these steps are so the correct index is passed to the producer fn
            const origValue = origFn.call($(el));
            const newValue = valueOrProducer.call(el, i, origValue);
            (origFn as TextSetterType).call($(el), newValue);
          } else {
            (origFn as TextSetterType).call($(elm), valueOrProducer ?? '');
          }
        });
      });
      return this;
    }
  } as JQueryTextFn;

type JQueryValFn = JQueryStatic['fn']['val'];

type JQueryValValue = string | number | string[];
type JQueryValProducer = (this: HTMLElement, index: number, value: JQueryValValue) => string;

/**
 * Patch jQuery's `val` function.
 *
 * @param origFn the original `val` function.
 * @returns the patched `val` function.
 */
const patchJqVal = (origFn: JQueryValFn): JQueryValFn =>
  function (this: JQuery<HTMLElement>, valueOrProducer?: JQueryValValue | JQueryValProducer): JQueryValValue | undefined | JQuery<HTMLElement> {
    // behave like original jQuery if argument is omitted
    if (arguments.length === 0) {
      if (this.length >= 1) {
        return withTinymceInstance(this[0], (ed) => ed.getContent(), (elm) => origFn.call($(elm)));
      }
      // when no elements exist to query simply return undefined
      return undefined;
    } else {
      type ValSetterType = (valueOrProducer: JQueryValValue | JQueryValProducer) => JQuery<HTMLElement>;
      this.each((i, el) => {
        withTinymceInstance(el, (ed) => {
          const val = Type.isFunction(valueOrProducer) ? valueOrProducer.call(el, i, ed.getContent()) : valueOrProducer ?? '';
          // We don't expect to be given arrays/numbers but it's in the type...
          const html = Type.isArray(val) ? val.join('') : `${val}`;
          ed.setContent(html);
        }, (elm) => {
          // work around bad type inference
          if (Type.isFunction(valueOrProducer)) {
            // these steps are so the correct index is passed to the producer fn
            const origValue = origFn.call($(el));
            const newValue = valueOrProducer.call(el, i, origValue ?? '');
            (origFn as ValSetterType).call($(el), newValue);
          } else {
            (origFn as ValSetterType).call($(elm), valueOrProducer ?? '');
          }
        });
      });
    }
    return this;
  } as JQueryValFn;

/**
 * This function patches internal jQuery functions so that if
 * you for example remove an div element containing an editor it's
 * automatically destroyed by the TinyMCE API.
 *
 * @param jq the jQuery instance to patch.
 */
export const patchJQueryFunctions = (jq: JQueryStatic) => {
  /* eslint-disable @typescript-eslint/unbound-method */
  jq.fn.html = patchJqHtml(jq.fn.html);
  jq.fn.text = patchJqText(jq.fn.text);
  jq.fn.val = patchJqVal(jq.fn.val);
  jq.fn.append = patchJqPend(jq.fn.append, 'append');
  jq.fn.prepend = patchJqPend(jq.fn.prepend, 'prepend');
  jq.fn.remove = patchJqRemove(jq.fn.remove);
  jq.fn.empty = patchJqEmpty(jq.fn.empty);
  jq.fn.attr = patchJqAttr(jq.fn.attr);
  /* eslint-enable @typescript-eslint/unbound-method */
};