import RootLogic from './logic/RootLogic';

window.root = new RootLogic()

window.addEventListener('load', () => root.init().catch(e => window.error_message.textContent = [e.toString(),e.stack].join('\n')))
