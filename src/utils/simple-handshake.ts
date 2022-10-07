const question = 'What is the answer to live, the universe and everything?';
const answer = '42';

window.addEventListener('message', ({ data, origin, source }) => {
  if (data === question && source !== window) {
    // Typescript kills compatability withtests in Karma here. That's why
    // we cannot test for `source instanceof Window` to resolve typescripts
    // headaches, so: ... any ;)
    // (... this is why we can't have nice things kids. :/ )
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    source.postMessage(answer, origin as any);
  }
});

export function hasParent() {
  const acceptAnswer = new Promise((resolve) => {
    const listener = ({ data } : { data: string }) => {
      if (data === answer) {
        resolve(true);
        window.removeEventListener('message', listener);
      }
    };
    window.addEventListener('message', listener);
  });

  const timeout = new Promise((resolve) => {
    // .1s is perceived as still being concurrent
    window.setTimeout(() => resolve(false), 100);
  });

  window.parent.postMessage(question, '*');
  return Promise.race([acceptAnswer, timeout]);
}

export async function withParent(fn: CallableFunction) {
  if (await hasParent()) {
    await fn();
  }
}
