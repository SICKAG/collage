import { v4 } from 'uuid';
import plugin from '../lib/collage-plugin';

export default plugin(async () => ({ id: v4() }));
