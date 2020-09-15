import { getTinymce, hasTinymce, getTinymceInstance } from './TinyMCE';


// Removes any child editor instances by looking for editor wrapper elements
const removeEditors = function (this: JQuery<HTMLElement>, name?: string) {
  // If the function is remove
  if (name === "remove") {
    this.each(function (i, node) {
      const ed = getTinymceInstance(node);

      if (ed) {
        ed.remove();
      }
    });
  }

  this.find("span.mceEditor,div.mceEditor").each(function (i, node) {
    const ed = getTinymce().get(node.id.replace(/_parent$/, ""));

    if (ed) {
      ed.remove();
    }
  });
};

// Loads or saves contents from/to textarea if the value
// argument is defined it will set the TinyMCE internal contents
const loadOrSave = function (this: JQuery<HTMLElement>, value?: string): string | void {
  const self = this;
  // Handle set value
  if (value !== null && value !== undefined) {
    removeEditors.call(self);
    // Saves the contents before get/set value of textarea/div
    self.each(function (i, node) {
      const ed = getTinymce().get(node.id);
      if (ed) {
        ed.setContent(value);
      }
    });
  } else if (self.length > 0) {
    // Handle get value
    const ed = getTinymce().get(self[0].id);
    if (ed) {
      return ed.getContent();
    }
  }
};

// Checks if the specified set contains tinymce instances
const containsTinyMCE = function (matchedSet: JQuery<HTMLElement>) {
  return !!((matchedSet) && (matchedSet.length) && hasTinymce() && (matchedSet.is(":tinymce")));
};

// This function patches internal jQuery functions so that if
// you for example remove an div element containing an editor it's
// automatically destroyed by the TinyMCE API
export const patchJQueryFunctions = (jq: JQueryStatic) => {
  // Patch various jQuery functions
  let jQueryFn: Record<string, Function> = {};

  // Patch some setter/getter functions these will
  // now be able to set/get the contents of editor instances for
  // example $('#editorid').html('Content'); will update the TinyMCE iframe instance
  jq.each(["text", "html", "val"], function (i, name: "text" | "html" | "val") {
    const origFn: Function = jQueryFn[name] = jq.fn[name],
      textProc = (name === "text");
    jq.fn[name] = function (value?: any): any {
      const self = this;

      if (!containsTinyMCE(self)) {
        return origFn.apply(self, arguments);
      }

      if (value !== undefined) {
        loadOrSave.call(self.filter(":tinymce"), value);
        origFn.apply(self.not(":tinymce"), arguments);

        return self; // return original set for chaining
      }

      let ret = "";
      const args = arguments;

      (textProc ? self : self.eq(0)).each(function (i, node) {
        const ed = getTinymceInstance(node);

        if (ed) {
          ret += textProc ? ed.getContent().replace(/<(?:"[^"]*"|'[^']*'|[^'">])*>/g, "") : ed.getContent({ save: true });
        } else {
          ret += origFn.apply(jq(node), args);
        }
      });

      return ret;
    };
  });

  // Makes it possible to use $('#id').append("content"); to append contents to the TinyMCE editor iframe
  jq.each(["append", "prepend"], function (i, name: "append" | "prepend") {
    const origFn = jQueryFn[name] = jq.fn[name],
      prepend = (name === "prepend");

    jq.fn[name] = function (value: any): any {
      const self = this;

      if (!containsTinyMCE(self)) {
        return origFn.apply(self, arguments as any);
      }

      if (value !== undefined) {
        if (typeof value === "string") {
          self.filter(":tinymce").each(function (i, node) {
            const ed = getTinymceInstance(node);

            if (ed) {
              ed.setContent(prepend ? value + ed.getContent() : ed.getContent() + value);
            }
          });
        }

        origFn.apply(self.not(":tinymce"), arguments as any);

        return self; // return original set for chaining
      }
    };
  });

  // Makes sure that the editor instance gets properly destroyed when the parent element is removed
  jq.each(["remove", "replaceWith", "replaceAll", "empty"], function (i, name: "remove" | "replaceWith" | "replaceAll" | "empty") {
    const origFn: Function = jQueryFn[name] = jq.fn[name];

    jq.fn[name] = function (): any {
      removeEditors.call(this, name);

      return origFn.apply(this, arguments);
    };
  });


  // Makes sure that $('#tinymce_id').attr('value') gets the editors current HTML contents
  jQueryFn.attr = jq.fn.attr;
  jq.fn.attr = function (name: any, value?: any): any {
    const self = this;
    const args = arguments;

    if ((!name) || (name !== "value") || (!containsTinyMCE(self))) {
      if (value !== undefined) {
        return jQueryFn.attr.apply(self, args);
      }

      return jQueryFn.attr.apply(self, args);
    }

    if (value !== undefined) {
      loadOrSave.call(self.filter(":tinymce"), value);
      jQueryFn.attr.apply(self.not(":tinymce"), args);

      return self; // return original set for chaining
    }

    const node = self[0];
    const ed = getTinymceInstance(node);

    return ed ? ed.getContent({ save: true }) : jQueryFn.attr.apply(jq(node), args);
  };
};