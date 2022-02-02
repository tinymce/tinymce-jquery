import { Arr, Thunk, Type } from '@ephox/katamari';
import { SandHTMLElement } from '@ephox/sand';
import { getTinymce, hasTinymce, withTinymceInstance } from './TinyMCE';

type AttrValueFn<T extends HTMLElement> = (this: T, index: number, attr: string) => string | number | void | undefined;
type AttrValueType<T extends HTMLElement> = string | number | null | AttrValueFn<T>;
type JQueryAttrParams<T extends HTMLElement> = [name: string] | [attributes: JQuery.PlainObject] | [name: string, value: AttrValueType<T>];

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

const removeEditors = (subject: JQuery<HTMLElement>) => {
  removeTargetElementEditor(subject);
  removeChildEditors(subject);
};

// Checks if the specified set contains tinymce instances
const containsTinyMCE = (matchedSet: JQuery<HTMLElement>) =>
  !!((matchedSet) && (matchedSet.length) && hasTinymce() && (matchedSet.is(':tinymce')));

/** type of jQuery's attr function */
type JQueryAttrFn = JQueryStatic['fn']['attr'];

/**
 * Makes sure that $('#tinymce_id').attr('value') gets the editors current HTML contents
 */
const patchJqAttr = (origAttrFn: JQueryAttrFn): JQueryAttrFn =>
  function (this: JQuery<HTMLElement>, ...args: JQueryAttrParams<HTMLElement>): string | undefined | JQuery<HTMLElement> {
    const [ name, value ] = args;
    // TODO check the case where name is an attribute map
    if (name !== 'value' || !containsTinyMCE(this)) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      return origAttrFn.apply(this, args as any);
    }
    // name is 'value', other cases are rejected above
    if (value === undefined) {
    // when the value is undefined get the value
      return withTinymceInstance(this[0],
        (ed) => ed.getContent({ save: true }),
        (_elm) => origAttrFn.call(this, name)
      );
    }
    // This is about to set the value which will wipe out child nodes.
    // If for some crazy reason there are child nodes of this which
    // have been converted into tinymce editors they are first removed...
    removeChildEditors(this);
    if (typeof value === 'string' || typeof value === 'number') {
    // Saves the contents before get/set value of textarea/div
      this.each((_i, elm) => withTinymceInstance(elm, (ed) => void ed.setContent('' + value)));
    } else if (value === null) {
    // normally this would mean "remove the value attribute",
    // however that doesn't make sense so instead we'll clear the content.
      this.each((_i, elm) => withTinymceInstance(elm, (ed) => void ed.setContent('')));
    } else {
    // the function allows updating based on the previous value
      this.each((_i, elm) => withTinymceInstance(elm, (ed) => {
        const prevValue = ed.getContent();
        const newValue = value.call(elm, 0, prevValue);
        if (typeof newValue === 'string' || typeof newValue === 'number') {
          ed.setContent('' + newValue);
        }
      }));
    }
    return this; // return original set of elements for chaining
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
const stringifyContent = (content: JQueryPendContent[]): string => {
  const strContent = Arr.map(content, (item) => {
    if (typeof item === 'string') {
      return item;
    } else if (Type.isArray(item)) {
      return stringifyContent(item);
    } else {
      // TODO should these wrap the node first to get outer HTML?
      if (item instanceof Node) {
        return $(item).html();
      } else {
        return item.html();
      }
    }
  });
  return strContent.join('');
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
    if (args.length === 1 && typeof args[0] === 'function') {
      const contentFn = args[0] as JQueryPendProducer;
      const contentStr = (el: HTMLElement, str: string) => stringifyContent([ contentFn.call(el, 0, str) ]);
      this.each((_i2, elm) => withTinymceInstance(elm,
        (ed) => {
          const oldContent = ed.getContent();
          const addition = contentStr(elm, oldContent);
          ed.setContent(prepend ? addition + oldContent : oldContent + addition);
        },
        (el) => void (origFn as Function).apply($(el), args)
      ));
    } else {
      const content = args as JQueryPendContent[];
      const contentStr = Thunk.cached(() => stringifyContent(content));

      this.each((_i2, elm) => withTinymceInstance(elm,
        (ed) => {
          const oldContent = ed.getContent();
          const addition = contentStr();
          ed.setContent(prepend ? addition + oldContent : oldContent + addition);
        },
        (el) => void (origFn as Function).apply($(el), args)
      ));
    }
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