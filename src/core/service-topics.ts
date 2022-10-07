import plugin from '../lib/collage-plugin';
import topics from './topics';

export default plugin(async (definition, context) => ({
}));

/**
 * convert topics in service declarations such that:
 *
 * services: {
 * language: {
 *   switchTo (lang) {
 *     this.topics.current.publish(lang);
 *   },
 *   topics: ['current']
 * },
 *},
 *
 * ...
 *
 * context.services.language.topics.current.subscribe(changeMyLanguage);
 * context.services.language.topics.current.publish('fr');
 * context.services.language.switchTo('fr');
 *
 *
 */
