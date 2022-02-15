import { Obj, Thunk, Type } from '@ephox/katamari';
import { SandHTMLElement } from '@ephox/sand';
import { getTinymce, withTinymceInstance } from './TinyMCE';

const removeTargetElementEditor = (suspectedTargetElements: JQuery<HTMLElement>) => {
  // check if we have a target element, if so remove the related TinyMCE
  suspectedTargetElements.each((_i, elm) => withTinymceInstance(elm, (ed) => ed.remove()));
};

const removeChildEditors = (subject: JQuery<HTMLElement>) => {
  // Look for child elements that are tinymce instances...
  // This should only do something if the element was not a target element
  // because we'd only expect the target element to contain HTML...
  subject.each((i, elem) => {
    for (const editor of getTinymce().get()) {
      if ($.contains(elem, editor.getContainer())) {
        editor.remove();
      }
    }
  });
};

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
        if (typeof valueOrProducer === 'string' || typeof valueOrProducer === 'number') {
          ed.setContent('' + valueOrProducer);
        } else if (valueOrProducer === null) {
          ed.setContent('');
        } else {
          const prevValue = ed.getContent();
          const newValue = valueOrProducer.call(elm, i, prevValue);
          if (typeof newValue === 'string' || typeof newValue === 'number') {
            ed.setContent('' + newValue);
          } else if (newValue === null) {
            ed.setContent('');
          }
        }
      }, (el) => {
        if (typeof valueOrProducer === 'function') {
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
    if (typeof nameOrBatch === 'string') {
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
        return withTinymceInstance(this[0],
          (ed) => ed.getContent({ save: true }),
          (_elm) => origAttrFn.call(this, 'value')
        );
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
    removeEditors(selector !== undefined ? this.find(selector) : this);
    return origFn.call(this, selector) as JQuery<T>;
  };

/** Type of jQuery's `replaceWith` function */
type JQueryReplaceWithFn = JQueryStatic['fn']['replaceWith'];

/**
 * Patch jQuery's `replaceWith` function.
 *
 * The `replaceWith` function replaces the original nodes with the passed nodes
 * or content, hence any existing TinyMCE editor should be destroyed first.
 *
 * @param origFn the original function.
 * @returns the patched function.
 */
const patchJqReplaceWith = (origFn: JQueryReplaceWithFn): JQueryReplaceWithFn =>
  function (this: JQuery<HTMLElement>, ...args: Parameters<JQueryReplaceWithFn>): JQuery<HTMLElement> {
    removeEditors(this);
    return origFn.apply(this, args);
  };

/** Type of jQuery's `replaceAll` function */
type JQueryReplaceAllFn = JQueryStatic['fn']['replaceAll'];

/**
 * Patch jQuery's `replaceAll` function.
 *
 * The `replaceAll` function replaces the target elements with `this`, hence
 * any TinyMCE instance in the target must be destroyed because it is being
 * removed from the DOM and any TinyMCE in `this` must be destroyed because
 * it is being moved.
 *
 * @param origFn the original function.
 * @returns the patched function.
 */
const patchJqReplaceAll = (origFn: JQueryReplaceAllFn): JQueryReplaceAllFn =>
  function (this: JQuery<HTMLElement>, target: string | JQuery<HTMLElement> | JQuery.TypeOrArray<Element>): JQuery<HTMLElement> {
    // TODO remove TinyMCE from targets
    removeEditors(this);
    return origFn.call(this, target);
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
    this.each((_i, elem) => {
      withTinymceInstance(elem, (ed) => {
        ed.setContent('');
      });
    });
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
  type T = (...contents: (string | JQuery.TypeOrArray<JQuery.Node | JQuery<JQuery.Node>>)[]) => JQuery<HTMLElement>;
  const elem = document.createElement('div');
  (origFn as T).apply($(elem), content);
  return elem.innerHTML;
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
    if (args.length === 1 && typeof args[0] === 'function') {
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
    if (htmlOrNodeOrProducer === undefined) { // get the HTML value
      if (this.length >= 1) {
        // when more than one item exists the value of the first one is retrieved
        return withTinymceInstance(this[0], (ed) => ed.getContent(), (el) => origFn.call($(el)));
      }
      // Though this is not in the types; experimentation shows
      // that when no item is present jQuery returns `undefined`.
      return undefined;
    } else { // set the HTML value
      // first we need to remove any editors we would overwrite
      removeChildEditors(this);
      // for all the nodes
      this.each((i, el) => {
        withTinymceInstance(el, (ed) => {
          // evaluate any producer to get the value
          const htmlOrNode = (
            typeof htmlOrNodeOrProducer === 'function'
              ? htmlOrNodeOrProducer.call(el, i, ed.getContent())
              : htmlOrNodeOrProducer
          );
          // convert a node into html
          const html = (
            typeof htmlOrNode === 'string'
              ? htmlOrNode
              : (() => {
                // if the node might have an editor remove it first.
                // TODO consider if we should copy the editor content instead?
                if (SandHTMLElement.isPrototypeOf(htmlOrNode)) {
                  removeEditors($(htmlOrNode));
                }
                // wrap the node in a div so we can get the outerHTML
                const n = $(htmlOrNode).wrapAll('<div></div>').parent();
                const out = origFn.call(n);
                // normally the node would be shifted from the original location
                // so we simulate that by removing it.
                n.remove();
                return out;
              })()
          );
          // finally update the editor with the html
          ed.setContent(html);
        }, (elm) => {
          // work around bad type inference
          (origFn as Function).call($(elm), htmlOrNodeOrProducer);
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
    if (valueOrProducer === undefined) { // get text value
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
      // first we need to remove any editors we would overwrite
      removeChildEditors(this);
      // for all the nodes
      this.each((i, el) => {
        withTinymceInstance(el, (ed) => {
          // evaluate any producer to get the value
          const val = Type.isFunction(valueOrProducer) ? valueOrProducer.call(el, i, ed.getContent({ format: 'text' })) : valueOrProducer;
          const text = `${val}`;
          // hmmm, we don't really have a way of setting text, this is not going to work well...
          // TODO consider if we can do what is done in lindy-hop or other alternatives like paste as text?
          ed.setContent(text);
        }, (elm) => {
          // work around bad type inference
          (origFn as Function).call($(elm), valueOrProducer);
        });
      });
      return this;
    }
  } as JQueryTextFn;

type JQueryValFn = JQueryStatic['fn']['val'];

type JQueryValValue = string | number | string[];
type JQueryValProducer = (this: HTMLElement, index: number, value: string) => string;

/**
 * Patch jQuery's `val` function.
 *
 * @param origFn the original `val` function.
 * @returns the patched `val` function.
 */
const patchJqVal = (origFn: JQueryValFn): JQueryValFn =>
  function (this: JQuery<HTMLElement>, valueOrProducer?: JQueryValValue | JQueryValProducer): JQueryValValue | undefined | JQuery<HTMLElement> {
    if (valueOrProducer === undefined) {
      if (this.length >= 1) {
        return withTinymceInstance(this[0], (ed) => ed.getContent(), (elm) => origFn.call($(elm)));
      } else {
        return undefined;
      }
    } else {
      this.each((i, el) => {
        withTinymceInstance(el, (ed) => {
          const val = Type.isFunction(valueOrProducer) ? valueOrProducer.call(el, i, ed.getContent()) : valueOrProducer;
          // We don't expect to be given arrays/numbers but it's in the type...
          const html = Type.isArray(val) ? val.join('') : `${val}`;
          ed.setContent(html);
        }, (elm) => {
          // work around bad type inference
          (origFn as Function).call($(elm), valueOrProducer);
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
  jq.fn.replaceWith = patchJqReplaceWith(jq.fn.replaceWith);
  jq.fn.replaceAll = patchJqReplaceAll(jq.fn.replaceAll);
  jq.fn.empty = patchJqEmpty(jq.fn.empty);
  jq.fn.attr = patchJqAttr(jq.fn.attr);
  /* eslint-enable @typescript-eslint/unbound-method */
};