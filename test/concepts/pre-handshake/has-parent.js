const question = 'grthfagsrbohgiuwyehraogiubeqw';
const answer = '76etsrgqkwaljersbfasregf';

window.addEventListener('message', ({ data, origin, source }) => {
  if (data === question && source !== window) {
    source.postMessage(answer, origin);
  }
});

const listenForAnswers = (resolve, next) => ({ data }) => {
  if (data === answer) {
    resolve(true);
    next();
  }
};

export default function hasParent() {
  const acceptAnswer = new Promise((resolve) => {
    const listener = listenForAnswers(resolve, () => {
      window.removeEventListener('message', listener);
    });
    window.addEventListener('message', listener);
  });

  const timeout = new Promise((resolve) => {
    // eslint-disable-next-line prefer-promise-reject-errors
    window.setTimeout(() => resolve(false), 75);
  });

  window.parent.postMessage(question, '*');
  try {
    return Promise.race([acceptAnswer, timeout]);
  } catch (_) {
    return false;
  }
}
