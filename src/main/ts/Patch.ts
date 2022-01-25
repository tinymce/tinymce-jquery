import { getTinymce, hasTinymce, withTinymceInstance } from './TinyMCE';

// Removes any child editor instances by looking for editor wrapper elements
const removeEditors = function (this: JQuery<HTMLElement>, name?: string) {
  // If the function is remove
  if (name === 'remove') {
    this.each((_i, elm) => {
      withTinymceInstance(elm, (ed) => ed.remove());
    });
  }

  this.find('span.mceEditor,div.mceEditor').each((i, node) => {
    const ed = getTinymce().get(node.id.replace(/_parent$/, ''));

    if (ed) {
      ed.remove();
    }
  });
};

// Loads or saves contents from/to textarea if the value
// argument is defined it will set the TinyMCE internal contents
const loadOrSave = function (this: JQuery<HTMLElement>, value?: string): string | void {
  // Handle set value
  if (value !== null && value !== undefined) {
    removeEditors.call(this);
    // Saves the contents before get/set value of textarea/div
    this.each((_i, elm) => {
      withTinymceInstance(elm, (ed) => ed.setContent(value));
    });
  } else if (this.length > 0) {
    // Handle get value
    return withTinymceInstance(this[0], (ed) => ed.getContent());
  }
};

// Checks if the specified set contains tinymce instances
const containsTinyMCE = (matchedSet: JQuery<HTMLElement>) =>
  !!((matchedSet) && (matchedSet.length) && hasTinymce() && (matchedSet.is(':tinymce')));

// This function patches internal jQuery functions so that if
// you for example remove an div element containing an editor it's
// automatically destroyed by the TinyMCE API
export const patchJQueryFunctions = (jq: JQueryStatic) => {
  // Patch various jQuery functions

  // Patch some setter/getter functions these will
  // now be able to set/get the contents of editor instances for
  // example $('#editorid').html('Content'); will update the TinyMCE iframe instance
  jq.each([ 'text', 'html', 'val' ] as const, (_i, name) => {
    const origFn: Function = jq.fn[name];
    const textProc = (name === 'text');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    jq.fn[name] = function (this: typeof jq.fn, ...args: any[]): any {

      if (!containsTinyMCE(this)) {
        return origFn.apply(this, args);
      }

      const value: string | undefined = args[0];
      if (value !== undefined) {
        // set value
        loadOrSave.call(this.filter(':tinymce'), value);
        origFn.apply(this.not(':tinymce'), args);
        return this; // return original set for chaining
      } else {
        // get value
        let ret = '';
        (textProc ? this : this.eq(0)).each((_i2, elm) => {
          ret += withTinymceInstance(elm,
            (ed) => ed.getContent(textProc ? { 'format': 'text' } : { 'save': true }),
            (elem) => origFn.apply(jq(elem), args)
          );
        });
        return ret;
      }
    };
  });

  // Makes it possible to use $('#id').append("content"); to append contents to the TinyMCE editor iframe
  jq.each([ 'append', 'prepend' ] as const, (_i, name) => {
    const origFn = jq.fn[name];
    const prepend = (name === 'prepend');

    jq.fn[name] = (function (this: typeof jq.fn, ...args: Parameters<typeof origFn>): ReturnType<typeof origFn> {

      if (!containsTinyMCE(this)) {
        return origFn.apply(this, args);
      }

      const value = args[0];
      if (value !== undefined) {
        if (typeof value === 'string') {
          this.filter(':tinymce').each((_i2, elm) => {
            withTinymceInstance(elm, (ed) => ed.setContent(prepend ? value + ed.getContent() : ed.getContent() + value));
          });
        }
        origFn.apply(this.not(':tinymce'), args);
      }

      return this; // return original set for chaining
    }) as typeof origFn ;
  });

  // Makes sure that the editor instance gets properly destroyed when the parent element is removed
  jq.each([ 'remove', 'replaceWith', 'replaceAll', 'empty' ] as const, (_i, name) => {
    const origFn: Function = jq.fn[name];

    jq.fn[name] = function (...args: any[]): any {
      removeEditors.call(this, name);

      return origFn.apply(this, args);
    };
  });

  // Makes sure that $('#tinymce_id').attr('value') gets the editors current HTML contents
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const origAttrFn = jq.fn.attr;
  jq.fn.attr = function (...args: any[]): any {
    const name = args[0];

    if (name !== 'value' || !containsTinyMCE(this)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      return origAttrFn.apply(this, args as any);
    }

    const value = args[1];
    if (value !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      loadOrSave.call(this.filter(':tinymce'), value);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      origAttrFn.apply(this.not(':tinymce'), args as any);

      return this; // return original set for chaining
    } else {
      return withTinymceInstance(this[0],
        (ed) => ed.getContent({ 'save': true }),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        (elm) => origAttrFn.apply(jq(elm), args as any)
      );
    }

  };
};