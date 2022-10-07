export const callService = (method, args) => {
  switch (method) {
    case 'test':
      return console.log('test');
    case 'notify':
      alert(args[0]);
      return args[0];
    default:
      break;
  }
}


