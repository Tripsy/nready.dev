import dayjs from 'dayjs';
// The `.js` is required, not stylistic: dayjs publishes its plugins as plain files with no
// `exports` map, so Node ESM will not resolve the extensionless specifier in the built
// output. `moduleResolution: "bundler"` lets tsc and tsx accept either form, which is why
// this only ever surfaced in `pnpm run build`.
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import timezone from 'dayjs/plugin/timezone.js';
import utc from 'dayjs/plugin/utc.js';

dayjs.extend(utc);
dayjs.extend(customParseFormat);
dayjs.extend(timezone);

export default dayjs;
