# vscode-bug-no-didClose

Sample project to reproduce an issue where `textDocument/didOpen` triggers for
files returned from "Find References", but no corresponding
`textDocument/didClose` triggers. The `didClose` event does not trigger even
after opening the file from the "References" pane and then closing it.
