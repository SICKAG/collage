import plugin from '../../lib/collage-plugin';
import { createFragmentUUID, isCollageUUID } from '../../lib/uuid';

/**
 * Creates an unique context by creating a unique id
 *
 * If the fragment has already an id, because it was embedded as collage-fragment
 * from an arrangement, then this id is used.
 */
export default plugin({
  enhanceExpose: async () => {
    let id = window.name;
    if (!isCollageUUID(id)) {
      id = createFragmentUUID();
    }

    return { id };
  },
});
