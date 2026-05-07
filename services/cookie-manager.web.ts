type Cookie = { value?: string };
type Cookies = Record<string, Cookie>;

const noop = async () => undefined;

const CookieManager = {
  get: async (_url: string): Promise<Cookies> => ({}),
  set: noop,
  clearAll: noop,
  clearByName: noop,
};

export default CookieManager;
