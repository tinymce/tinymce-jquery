import { Global } from './Global';

type TinymceGlobal = typeof import('tinymce');

const tinymce = (): (TinymceGlobal | null) => Global.tinymce ?? null;

export const hasTinymce = () => !!(tinymce());

export const getTinymce = (): TinymceGlobal => {
  const tiny = tinymce();
  if (tiny != null) {
    return tiny;
  }
  throw new Error('Expected global tinymce');
};

// Returns tinymce instance for the specified element or null if it wasn't found
export const getTinymceInstance = function (element: Element) {
  let ed = null;

  if (element && element.id && hasTinymce()) {
    ed = getTinymce().get(element.id);
  }

  return ed;
};

enum LoadStatus {
  NOT_LOADING = 0,
  LOADING_STARTED = 1,
  LOADING_FINISHED = 2
}

type TinymceCallback = (tinymce: TinymceGlobal, loadedFromProvidedUrl: boolean) => void;

let lazyLoading = LoadStatus.NOT_LOADING;
const callbacks: TinymceCallback[] = [];

export const loadTinymce = (url: string, callback: TinymceCallback) => {
  // Load TinyMCE on demand, if we need to
  if (!hasTinymce() && lazyLoading === LoadStatus.NOT_LOADING) {
    lazyLoading = LoadStatus.LOADING_STARTED;

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.onload = function (e: Event) {
      if (lazyLoading !== LoadStatus.LOADING_FINISHED && e.type === 'load') {
        lazyLoading = LoadStatus.LOADING_FINISHED;
        const tiny = getTinymce();
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