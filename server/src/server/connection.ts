import { Range, createConnection, TextDocuments, TextDocumentChangeEvent, ProposedFeatures, InitializeParams, TextDocumentSyncKind, InitializeResult, Location, ReferenceParams, Diagnostic, Position, DiagnosticSeverity } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { URI } from 'vscode-uri';
import { readdirSync } from 'node:fs';
import { extname, join } from 'node:path';

export class LSPServer {
    private connection = createConnection(ProposedFeatures.all);
    private documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);
    private workspaceFolder: string | undefined;

    public constructor() {
        console.log('Creating LSPServer with options');

        this.connection.onInitialize(this.onInitialize);
        this.documents.onDidOpen(this.onDidOpen);
        this.documents.onDidChangeContent(this.onDidChangeContent);
        this.documents.onDidClose(this.onDidClose);
        this.connection.onReferences(this.onReferences);

        this.documents.listen(this.connection);
    }

    public listen() {
        this.connection.listen();
    }

    private onInitialize = async (params: InitializeParams): Promise<InitializeResult> => {
        const result: InitializeResult = {
            capabilities: {
                textDocumentSync: TextDocumentSyncKind.Incremental,
                referencesProvider: true
            }
        };

        const workspaceFolderUri = params.workspaceFolders?.[0].uri;

        if (workspaceFolderUri) {
            this.workspaceFolder = URI.parse(workspaceFolderUri).fsPath;
        }

        return result;
    };

    private onDidOpen = async (e: TextDocumentChangeEvent<TextDocument>) => {
        const { uri } = e.document;

        // Send a diagnostic
        this.connection.sendDiagnostics({
            uri,
            diagnostics: [
                { range: Range.create(Position.create(1, 1), Position.create(1, 1)), message: "Diagnostic error", severity: DiagnosticSeverity.Error }
            ]
        });
    };

    private onDidClose = async (e: TextDocumentChangeEvent<TextDocument>) => {
        const { uri } = e.document;

        // Clear diagnostics
        this.connection.sendDiagnostics({
            uri,
            diagnostics: []
        });
    };

    private onDidChangeContent = async (e: TextDocumentChangeEvent<TextDocument>) => {
        const { uri } = e.document;

        // Send diagnostics
        this.connection.sendDiagnostics({
            uri,
            diagnostics: [
                {
                    range: Range.create(Position.create(0, 0), Position.create(0, 1)),
                    message: "Diagnostic error",
                    severity: DiagnosticSeverity.Error
                }
            ]
        });
    };

    private onReferences = async (params: ReferenceParams): Promise<Location[] | null | undefined> => {
        const { fsPath } = URI.parse(params.textDocument.uri);
        const { workspaceFolder } = this;
        if (!workspaceFolder) {
            return null;
        }

        const readDirectoryRecursive = (directory: string) => {
            try {
                let files = Array<string>();

                const entries = readdirSync(directory, { withFileTypes: true });

                for (const entry of entries) {
                    const fullPath = join(directory, entry.name);

                    if (entry.isDirectory()) {
                        const subdirectoryFiles = readDirectoryRecursive(fullPath);
                        files = files.concat(subdirectoryFiles);
                    } else if (extname(fullPath) === ".txt") {
                        files.push(URI.file(fullPath).toString());
                    }
                }

                return files;
            } catch (error) {
                throw error;
            }
        };

        const textFiles = readDirectoryRecursive(workspaceFolder);
        console.log("got textfiles", textFiles);

        const locations: Location[] = textFiles.map(uri => Location.create(uri, Range.create(Position.create(0, 0), Position.create(0, 1))));
        return locations;
    };
}
