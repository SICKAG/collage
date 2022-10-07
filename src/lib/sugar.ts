export default function onloaded(name: string, callback: CallableFunction) {
  document.addEventListener(
    'collage-fragment-loaded',
    ({ detail }: Partial<CustomEvent>) => {
      const iframe = document.querySelector(`iframe[name="${detail}"]`);
      const fragment = iframe?.closest('collage-fragment');
      const fragmentName = fragment?.getAttribute('name');
      if (fragmentName === name) {
        callback();
      }
    },
  );
}
