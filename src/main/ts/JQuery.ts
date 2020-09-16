import { Global } from './Global';

const jquery = (): (typeof import('jquery')) | null => (Global && Global.jQuery) ?? null;

export const getJquery = () => {
  const jq = jquery();
  if (jq != null) {
    return jq;
  }
  throw new Error('Expected global jQuery');
};