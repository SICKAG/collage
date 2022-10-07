window.addEventListener('message', ({ data, origin, source }) => {
  if (source !== window && source === window.parent) {
    document.querySelector('#answer').textContent = data;
  } else if (data === 'Is there anybody out there?') {
    source.postMessage('Hello? Is there anybody in there?', origin);
  }
});
window.parent.postMessage('Is there anybody out there?', '*');
