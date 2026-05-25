import { Global } from './Global';

const jquery = (): JQueryStatic | null => (Global && Global.jQuery) ?? null;

export const getJquery = () => {
  const jq = jquery();
  if (jq != null) {
    return jq;
  }
  throw new Error('Expected global jQuery');
};