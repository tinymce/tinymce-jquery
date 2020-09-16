import { getTinymce, hasTinymce, getTinymceInstance } from './TinyMCE';


// Removes any child editor instances by looking for editor wrapper elements
const removeEditors = function (this: JQuery<HTMLElement>, name?: string) {
  // If the function is remove
  if (name === 'remove') {
    this.each(function (i, node) {
      const ed = getTinymceInstance(node);

      if (ed) {
        ed.remove();
      }
    });
  }

  this.find('span.mceEditor,div.mceEditor').each(function (i, node) {
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
    this.each(function (i, node) {
      const ed = getTinymce().get(node.id);
      if (ed) {
        ed.setContent(value);
      }
    });
  } else if (this.length > 0) {
    // Handle get value
    const ed = getTinymce().get(this[0].id);
    if (ed) {
      return ed.getContent();
    }
  }
};

// Checks if the specified set contains tinymce instances
const containsTinyMCE = function (matchedSet: JQuery<HTMLElement>) {
  return !!((matchedSet) && (matchedSet.length) && hasTinymce() && (matchedSet.is(':tinymce')));
};

// This function patches internal jQuery functions so that if
// you for example remove an div element containing an editor it's
// automatically destroyed by the TinyMCE API
export const patchJQueryFunctions = (jq: JQueryStatic) => {
  // Patch various jQuery functions
  const jQueryFn: Record<string, Function> = {};

  // Patch some setter/getter functions these will
  // now be able to set/get the contents of editor instances for
  // example $('#editorid').html('Content'); will update the TinyMCE iframe instance
  jq.each([ 'text', 'html', 'val' ], function (_i, name: 'text' | 'html' | 'val') {
    const origFn: Function = jQueryFn[name] = jq.fn[name];
    const textProc = (name === 'text');
    jq.fn[name] = function (...args: any[]): any {
      const value = args[0];

      if (!containsTinyMCE(this)) {
        return origFn.apply(this, args);
      }

      if (value !== undefined) {
        loadOrSave.call(this.filter(':tinymce'), value);
        origFn.apply(this.not(':tinymce'), args);

        return this; // return original set for chaining
      }

      let ret = '';

      (textProc ? this : this.eq(0)).each(function (_i2, node) {
        const ed = getTinymceInstance(node);

        if (ed) {
          ret += textProc ? ed.getContent({ 'format': 'text' }) : ed.getContent({ 'save': true });
        } else {
          ret += origFn.apply(jq(node), args);
        }
      });

      return ret;
    };
  });

  // Makes it possible to use $('#id').append("content"); to append contents to the TinyMCE editor iframe
  jq.each([ 'append', 'prepend' ], function (_i, name: 'append' | 'prepend') {
    const origFn = jQueryFn[name] = jq.fn[name];
    const prepend = (name === 'prepend');

    jq.fn[name] = function (...args: any[]): any {
      const value = args[0];

      if (!containsTinyMCE(this)) {
        return origFn.apply(this, args as any);
      }

      if (value !== undefined) {
        if (typeof value === 'string') {
          this.filter(':tinymce').each(function (_i2, node) {
            const ed = getTinymceInstance(node);

            if (ed) {
              ed.setContent(prepend ? value + ed.getContent() : ed.getContent() + value);
            }
          });
        }

        origFn.apply(this.not(':tinymce'), args as any);

        return this; // return original set for chaining
      }
    };
  });

  // Makes sure that the editor instance gets properly destroyed when the parent element is removed
  jq.each([ 'remove', 'replaceWith', 'replaceAll', 'empty' ], function (i, name: 'remove' | 'replaceWith' | 'replaceAll' | 'empty') {
    const origFn: Function = jQueryFn[name] = jq.fn[name];

    jq.fn[name] = function (...args: any[]): any {
      removeEditors.call(this, name);

      return origFn.apply(this, args);
    };
  });


  // Makes sure that $('#tinymce_id').attr('value') gets the editors current HTML contents
  // eslint-disable-next-line @typescript-eslint/unbound-method
  jQueryFn.attr = jq.fn.attr;
  jq.fn.attr = function (...args: any[]): any {
    const name = args[0];
    const value = args[1];

    if ((!name) || (name !== 'value') || (!containsTinyMCE(this))) {
      if (value !== undefined) {
        return jQueryFn.attr.apply(this, args);
      }

      return jQueryFn.attr.apply(this, args);
    }

    if (value !== undefined) {
      loadOrSave.call(this.filter(':tinymce'), value);
      jQueryFn.attr.apply(this.not(':tinymce'), args);

      return this; // return original set for chaining
    }

    const node = this[0];
    const ed = getTinymceInstance(node);

    return ed ? ed.getContent({ 'save': true }) : jQueryFn.attr.apply(jq(node), args);
  };
};