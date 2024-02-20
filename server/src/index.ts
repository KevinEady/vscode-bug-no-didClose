import { LSPServer } from './server/connection';

console.log(`Escript Language Server started [pid ${process.pid}]`);
new LSPServer().listen();
