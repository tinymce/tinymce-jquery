import { Editor, TinyMCE as TinyMCEGlobal } from 'tinymce';
import { Global } from './Global';

const tinymce = (): (TinyMCEGlobal | null) => Global.tinymce ?? null;

export const hasTinymce = () => !!(tinymce());

export const getTinymce = (): TinyMCEGlobal => {
  const tiny = tinymce();
  if (tiny != null) {
    return tiny;
  }
  throw new Error('Expected global tinymce');
};

// Returns tinymce instance for the specified element or null if it wasn't found
export const getTinymceInstance = (element: Element) => {
  let ed = null;

  if (element && element.id && hasTinymce()) {
    ed = getTinymce().get(element.id);
  }

  return ed;
};

export const withTinymceInstance: {
  <T> (node: HTMLElement, ifPresent: (ed: Editor) => T): (T | void);
  <T> (node: HTMLElement, ifPresent: (ed: Editor) => T, ifMissing: (elem: HTMLElement) => T): T;
} = (node: HTMLElement, ifPresent: (ed: Editor) => any, ifMissing?: (elem: HTMLElement) => any): any => {
  const ed = getTinymceInstance(node);
  if (ed) {
    return ifPresent(ed);
  } else if (ifMissing) {
    return ifMissing(node);
  }
};

enum LoadStatus {
  NOT_LOADING = 0,
  LOADING_STARTED = 1,
  LOADING_FINISHED = 2
}

type TinymceCallback = (tinymce: TinyMCEGlobal, loadedFromProvidedUrl: boolean) => void;

let lazyLoading = LoadStatus.NOT_LOADING;
const callbacks: TinymceCallback[] = [];

export const loadTinymce = (url: string, callback: TinymceCallback) => {
  // Load TinyMCE on demand, if we need to
  if (!hasTinymce() && lazyLoading === LoadStatus.NOT_LOADING) {
    lazyLoading = LoadStatus.LOADING_STARTED;

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.onload = (e: Event) => {
      if (lazyLoading !== LoadStatus.LOADING_FINISHED && e.type === 'load') {
        lazyLoading = LoadStatus.LOADING_FINISHED;
        const tiny = getTinymce();
        // the original runs the callback function settings.script_loaded
        // when the settings.script_url script has been loaded
        // the second parameter here is to enable that functionality
        // by indicating if the `url` was loaded into the page (true)
        // or an existing global or other script was used (false)
        callback(tiny, true);
        // eslint-disable-next-line @typescript-eslint/prefer-for-of
        for (let i = 0; i < callbacks.length; i++) {
          callbacks[i](tiny, false);
        }
      }
    };
    script.src = url;
    document.body.appendChild(script);
  } else {
    // Delay the init call until tinymce is loaded
    if (lazyLoading === LoadStatus.LOADING_STARTED) {
      callbacks.push(callback);
    } else {
      callback(getTinymce(), false);
    }
  }
};